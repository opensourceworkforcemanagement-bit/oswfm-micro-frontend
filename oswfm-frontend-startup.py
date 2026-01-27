#!/usr/bin/env python3
"""
Rsbuild Module Federation Microfrontend Startup Script
Handles dependency installation and project startup for multiple microservices
"""

import os
import sys
import subprocess
import json
from pathlib import Path
import argparse
import time
from threading import Thread

class RsbuildMFStarter:
    def __init__(self, project_path='.', package_manager='npm', name=None):
        self.project_path = Path(project_path).resolve()
        self.package_manager = package_manager
        self.package_json = self.project_path / 'package.json'
        self.name = name or self.project_path.name
        
    def check_node_installed(self):
        """Check if Node.js is installed"""
        try:
            result = subprocess.run(['node', '--version'], 
                                  capture_output=True, text=True, shell=True)
            if result.returncode == 0:
                print(f"[{self.name}] ✓ Node.js version: {result.stdout.strip()}")
                return True
            else:
                print(f"[{self.name}] ✗ Node.js check failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"[{self.name}] ✗ Node.js is not installed or not in PATH!")
            print(f"Error: {e}")
            print("Please install Node.js from https://nodejs.org/")
            return False
    
    def check_package_manager(self):
        """Check if package manager is installed"""
        try:
            result = subprocess.run([self.package_manager, '--version'],
                                  capture_output=True, text=True, shell=True)
            if result.returncode == 0:
                print(f"[{self.name}] ✓ {self.package_manager} version: {result.stdout.strip()}")
                return True
            else:
                print(f"[{self.name}] ✗ {self.package_manager} check failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"[{self.name}] ✗ {self.package_manager} is not installed or not in PATH!")
            print(f"Error: {e}")
            return False
    
    def check_package_json(self):
        """Verify package.json exists"""
        if not self.package_json.exists():
            print(f"[{self.name}] ✗ package.json not found in {self.project_path}")
            return False
        print(f"[{self.name}] ✓ Found package.json")
        return True
    
    def install_dependencies(self):
        """Install project dependencies"""
        print(f"[{self.name}] 📦 Installing dependencies using {self.package_manager}...")
        
        install_cmd = {
            'npm': ['npm', 'install'],
            'yarn': ['yarn', 'install'],
            'pnpm': ['pnpm', 'install']
        }
        
        cmd = install_cmd.get(self.package_manager, ['npm', 'install'])
        
        try:
            result = subprocess.run(
                cmd, 
                cwd=self.project_path, 
                shell=True,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print(f"[{self.name}] ✓ Dependencies installed successfully")
                return True
            else:
                print(f"[{self.name}] ✗ Failed to install dependencies")
                print(f"Error: {result.stderr}")
                return False
        except Exception as e:
            print(f"[{self.name}] ✗ Failed to install dependencies: {e}")
            return False
    
    def get_package_scripts(self):
        """Read available scripts from package.json"""
        try:
            with open(self.package_json, 'r') as f:
                data = json.load(f)
                return data.get('scripts', {})
        except Exception as e:
            print(f"[{self.name}] Warning: Could not read package.json scripts: {e}")
            return {}
    
    def start_dev_server(self, script='dev', port=None):
        """Start the development server"""
        scripts = self.get_package_scripts()
        
        if script not in scripts:
            print(f"[{self.name}] ⚠ Script '{script}' not found in package.json")
            print(f"[{self.name}] Available scripts: {', '.join(scripts.keys())}")
            return False
        
        print(f"[{self.name}] 🚀 Starting development server with '{script}' script...")
        
        run_cmd = {
            'npm': f'npm run {script}',
            'yarn': f'yarn {script}',
            'pnpm': f'pnpm {script}'
        }
        
        cmd = run_cmd.get(self.package_manager, f'npm run {script}')
        
        # Add port if specified
        env = os.environ.copy()
        if port:
            env['PORT'] = str(port)
            print(f"[{self.name}] Setting PORT={port}")
        
        try:
            process = subprocess.Popen(
                cmd,
                cwd=self.project_path, 
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                shell=True
            )
            
            # Print output with service name prefix
            for line in process.stdout:
                print(f"[{self.name}] {line.rstrip()}")
            
            process.wait()
            return True
        except KeyboardInterrupt:
            print(f"\n[{self.name}] ✓ Development server stopped")
            if process:
                process.terminate()
            return True
        except Exception as e:
            print(f"[{self.name}] ✗ Failed to start server: {e}")
            return False
    
    def run_checks(self):
        """Run all prerequisite checks"""
        if not self.check_node_installed():
            return False
        if not self.check_package_manager():
            return False
        if not self.check_package_json():
            return False
        return True
    
    def run(self, install=True, script='dev', port=None):
        """Main execution flow"""
        print(f"\n{'=' * 60}")
        print(f"Starting: {self.name}")
        print(f"Path: {self.project_path}")
        print(f"{'=' * 60}")
        
        # Check prerequisites
        if not self.run_checks():
            return False
        
        # Install dependencies
        if install:
            if not self.install_dependencies():
                return False
        else:
            print(f"[{self.name}] ⏭ Skipping dependency installation")
        
        # Start server
        return self.start_dev_server(script, port)


class MultiServiceManager:
    def __init__(self, paths, package_manager='npm'):
        self.services = []
        self.processes = []
        
        for i, path in enumerate(paths):
            service = RsbuildMFStarter(
                project_path=path,
                package_manager=package_manager,
                name=Path(path).name
            )
            self.services.append(service)
    
    def install_all(self):
        """Install dependencies for all services"""
        print("\n" + "=" * 60)
        print("Installing dependencies for all services")
        print("=" * 60)
        
        for service in self.services:
            if not service.run_checks():
                return False
            #if not service.install_dependencies():
            #    return False
        
        return True
    
    def start_all(self, script='dev', start_ports=None):
        """Start all services in parallel"""
        print("\n" + "=" * 60)
        print(f"Starting {len(self.services)} microservices")
        print("=" * 60 + "\n")
        
        threads = []
        
        for i, service in enumerate(self.services):
            port = start_ports[i] if start_ports and i < len(start_ports) else None
            
            thread = Thread(
                target=service.start_dev_server,
                args=(script, port),
                daemon=True
            )
            thread.start()
            threads.append(thread)
            time.sleep(0.5)  # Stagger startup slightly
        
        try:
            # Wait for all threads
            for thread in threads:
                thread.join()
        except KeyboardInterrupt:
            print("\n\n" + "=" * 60)
            print("✓ All services stopped")
            print("=" * 60)
    
    def run(self, install=True, script='dev', start_ports=None):
        """Install and start all services"""
        if install:
            if not self.install_all():
                return False
        else:
            print("\n⏭ Skipping dependency installation for all services")
        
        self.start_all(script, start_ports)
        return True


def main():
    parser = argparse.ArgumentParser(
        description='Install dependencies and start Rsbuild Module Federation microfrontends'
    )
    parser.add_argument(
        '--path', 
        nargs='+',
        required=True,
        help='Path(s) to microservice directories (space-separated for multiple)'
    )
    parser.add_argument(
        '--pm', 
        choices=['npm', 'yarn', 'pnpm'], 
        default='npm',
        help='Package manager to use (default: npm)'
    )
    parser.add_argument(
        '--skip-install', 
        action='store_true',
        help='Skip dependency installation'
    )
    parser.add_argument(
        '--script', 
        default='dev',
        help='npm script to run (default: dev)'
    )
    parser.add_argument(
        '--ports', 
        nargs='+',
        type=int,
        help='Port numbers for each service (space-separated, optional)'
    )
    
    args = parser.parse_args()
    
    # Validate paths
    for path in args.path:
        if not Path(path).exists():
            print(f"✗ Error: Path does not exist: {path}")
            sys.exit(1)
    
    print("=" * 60)
    print("Rsbuild Module Federation Multi-Service Startup")
    print("=" * 60)
    print(f"Services: {len(args.path)}")
    for i, path in enumerate(args.path):
        port_info = f" (port: {args.ports[i]})" if args.ports and i < len(args.ports) else ""
        print(f"  {i+1}. {Path(path).name} - {path}{port_info}")
    print("=" * 60)
    
    if len(args.path) == 1:
        # Single service mode
        starter = RsbuildMFStarter(
            project_path=args.path[0],
            package_manager=args.pm,
            name=Path(args.path[0]).name
        )
        success = starter.run(
            install=not args.skip_install,
            script=args.script,
            port=args.ports[0] if args.ports else None
        )
    else:
        # Multi-service mode
        manager = MultiServiceManager(
            paths=args.path,
            package_manager=args.pm
        )
        success = manager.run(
            install=not args.skip_install,
            script=args.script,
            start_ports=args.ports
        )
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
