import { createRoot } from "react-dom/client";
import TimesheetManagement from "./pages/TimesheetManagement";

const container = document.getElementById("timesheet");
if (container) {
  const root = createRoot(container);
  root.render(<TimesheetManagement />);
}
