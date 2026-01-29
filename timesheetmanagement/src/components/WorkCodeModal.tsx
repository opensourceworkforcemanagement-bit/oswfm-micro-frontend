import React, { useState } from 'react';
import { Modal, Button, TextInput, Table, ScrollArea, Stack } from '@mantine/core';
import '../styles/App.css';
import { WorkforceCode } from '@/types/workcode.types';


interface WorkforceCodeModalProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (workforceCode: WorkforceCode) => void;
  availableWorkforceCode: WorkforceCode[];
  title?: string;
}

function WorkforceCodeModal({
  opened,
  onClose,
  onSelect,
  availableWorkforceCode,
  title = 'Select Work Code',
}: WorkforceCodeModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatDateForFilter = (date: Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString().toLowerCase();
  };

  const getStatusLabelForFilter = (status: number) => {
    switch (status) {
      case 1:
        return 'active';
      case 0:
        return 'inactive';
      default:
        return String(status);
    }
  };

  const filteredWorkforceCode = availableWorkforceCode.filter(
    (workforceCode) => {
      const search = searchTerm.toLowerCase();
      return (
        (workforceCode.shortCodeValue?.toLowerCase() || '').includes(search) ||
        (workforceCode.longCodeValue?.toLowerCase() || '').includes(search) ||
        (workforceCode.description?.toLowerCase() || '').includes(search) ||
        (workforceCode.prefix?.toLowerCase() || '').includes(search) ||
        (workforceCode.suffix?.toLowerCase() || '').includes(search) ||
        getStatusLabelForFilter(workforceCode.status).includes(search) ||
        formatDateForFilter(workforceCode.effectiveDate).includes(search) ||
        formatDateForFilter(workforceCode.expirationDate).includes(search)
      );
    }
  );

  const handleSelect = (workforceCode: WorkforceCode) => {
    onSelect(workforceCode);
    setSearchTerm('');
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
  };

  const formatDate = (date: Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1:
        return 'Active';
      case 0:
        return 'Inactive';
      default:
        return String(status);
    }
  };

  // Check if work code is inactive or will expire within 5 days
  const shouldBlinkRow = (workforceCode: WorkforceCode): boolean => {
    const isInactive = workforceCode.status === 0;
    if (isInactive) return true;

    if (!workforceCode.expirationDate) return false;
    const expirationDate = new Date(workforceCode.expirationDate);
    const today = new Date();
    const fiveDaysFromNow = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
    return expirationDate <= fiveDaysFromNow;
  };

  const rows = filteredWorkforceCode.map((workforceCode) => {
    const shouldBlink = shouldBlinkRow(workforceCode);
    return (
      <Table.Tr
        key={workforceCode.id}
        className={shouldBlink ? 'work-code-warning' : undefined}
      >
        <Table.Td>{workforceCode.shortCodeValue}</Table.Td>
        <Table.Td>{workforceCode.longCodeValue}</Table.Td>
        <Table.Td>{workforceCode.description}</Table.Td>
        <Table.Td>{getStatusLabel(workforceCode.status)}</Table.Td>
        <Table.Td>{formatDate(workforceCode.effectiveDate)}</Table.Td>
        <Table.Td>{formatDate(workforceCode.expirationDate)}</Table.Td>
        <Table.Td>
          <Button size="xs" onClick={() => handleSelect(workforceCode)}>
            Select
          </Button>
        </Table.Td>
      </Table.Tr>
    ) as React.ReactNode;
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      size="xl"
    >
      <Stack>
        <TextInput
          placeholder="Search by code, description, status, or date..."
          value={searchTerm}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.currentTarget.value)}
        />
        <ScrollArea h={300}>
          <Table striped highlightOnHover stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Short Code</Table.Th>
                <Table.Th>Long Code</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Effective Date</Table.Th>
                <Table.Th>Expiration Date</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
    </Modal>
  );
}

export default WorkforceCodeModal;
