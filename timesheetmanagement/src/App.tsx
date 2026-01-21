import React from "react";
import "@glideapps/glide-data-grid/dist/index.css";

import {
  DataEditor,
  GridCell,
  GridCellKind,
  GridColumn,
  GridColumnIcon,
  Item
} from "@glideapps/glide-data-grid";

interface BeautifulWrapperProps {
  title?: string;
  children?: React.ReactNode;
}

const BeautifulWrapper: React.FC<BeautifulWrapperProps> = ({ title, children }) => (
  <div style={{ padding: 12 }}>
    {title && <h2 style={{ margin: "0 0 8px 0" }}>{title}</h2>}
    <div>{children}</div>
  </div>
);

const data = [
  {
    firstName: "John",
    lastName: "Doe"
  },
  {
    firstName: "Maria",
    lastName: "Garcia"
  },
  {
    firstName: "Nancy",
    lastName: "Jones"
  },
  {
    firstName: "James",
    lastName: "Smith"
  }
];

// Grid columns may also provide icon, overlayIcon, menu, style, and theme overrides
const columns: GridColumn[] = [
  { title: "First Name", width: 100, icon: GridColumnIcon.HeaderString},
  { title: "Last Name", width: 100, icon: GridColumnIcon.HeaderSplitString }
];

// If fetching data is slow you can use the DataEditor ref to send updates for cells
// once data is loaded.
function getData([col, row]: Item): GridCell {
  const person = data[row];

  if (col === 0) {
    return {
      kind: GridCellKind.Bubble,
      data: [person.firstName],
      allowOverlay: true,
      //displayData: person.firstName
    };
  } else if (col === 1) {
    return {
      kind: GridCellKind.Text,
      data: person.lastName,
      allowOverlay: false,
      displayData: person.lastName
    };
  } else {
    throw new Error();
  }
}

export default function App() {
  return (
        <BeautifulWrapper
            title="Selection Serialization">
  
      <DataEditor columns={columns} getCellContent={getData} rows={data.length} 
      onCellClicked={(cell) => { 
        console.log("Cell clicked:", cell); 
        }} 
         getCellsForSelection
          rowMarkers="number"
          smoothScrollX
          smoothScrollY
          width="100%"
        />

        </BeautifulWrapper>
  );
}
