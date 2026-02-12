// ============================================================
// AST → React Code Generator
// ============================================================
// Takes a validated UIAST and produces deterministic TSX code
// that uses ONLY registry components with variant props.
// ============================================================

import {
  UIAST,
  UIASTNode,
  ALLOWED_COMPONENT_TYPES,
  validateNodeProps,
} from "@/lib/schema/ui-ast";

// Maps component type → import path
const IMPORT_MAP: Record<string, string> = {
  Button: "@/components/ui-lib/Button",
  Input: "@/components/ui-lib/Input",
  Card: "@/components/ui-lib/Card",
  CardHeader: "@/components/ui-lib/Card",
  CardTitle: "@/components/ui-lib/Card",
  CardDescription: "@/components/ui-lib/Card",
  CardContent: "@/components/ui-lib/Card",
  CardFooter: "@/components/ui-lib/Card",
  Box: "@/components/ui-lib/Layouts",
  Stack: "@/components/ui-lib/Layouts",
  Grid: "@/components/ui-lib/Layouts",
  Container: "@/components/ui-lib/Layouts",
  Heading: "@/components/ui-lib/Typography",
  Text: "@/components/ui-lib/Typography",
  Table: "@/components/ui-lib/Table",
  TableHeader: "@/components/ui-lib/Table",
  TableBody: "@/components/ui-lib/Table",
  TableRow: "@/components/ui-lib/Table",
  TableHead: "@/components/ui-lib/Table",
  TableCell: "@/components/ui-lib/Table",
  TableFooter: "@/components/ui-lib/Table",
  TableCaption: "@/components/ui-lib/Table",
  Modal: "@/components/ui-lib/Modal",
  Navbar: "@/components/ui-lib/Navbar",
  Sidebar: "@/components/ui-lib/Sidebar",
  SidebarItem: "@/components/ui-lib/Sidebar",
  BarChart: "@/components/ui-lib/Chart",
  LineChart: "@/components/ui-lib/Chart",
  PieChart: "@/components/ui-lib/Chart",
};

// Props that take function handlers (written inline)
const HANDLER_PROPS = new Set(["onClick", "onClose", "onChange"]);

// Props that take boolean/number values (not quoted)
const RAW_VALUE_PROPS = new Set([
  "isLoading",
  "isOpen",
  "isActive",
  "disabled",
  "columns",
  "level",
  "elevation",
  "collapsible",
  "defaultCollapsed",
  "hasDropdown",
  "responsive",
]);

// Icons that conflict with component names need aliases
const ICON_CONFLICTS: Record<string, string> = {
  BarChart: "BarChartIcon",
  Table: "TableIcon",
  Card: "CardIcon",
  Input: "InputIcon",
};

export interface GeneratorResult {
  code: string;
  errors: string[];
  warnings: string[];
  usedComponents: string[];
  usedIcons: string[];
}

/**
 * Generate React TSX code from a validated UIAST.
 */
export function generateCodeFromAST(ast: UIAST): GeneratorResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const usedComponents = new Set<string>();
  const usedIcons = new Set<string>();
  const stateDeclarations: string[] = [];
  const handlerDeclarations: string[] = [];

  // Detect if we need useState for Modal, Sidebar collapse, Navbar dropdown
  let needsModalState = false;
  let needsSidebarCollapse = false;
  let needsNavDropdown = false;

  function scanForState(nodes: (UIASTNode | string)[]) {
    for (const node of nodes) {
      if (typeof node === "string") continue;
      if (node.type === "Modal") needsModalState = true;
      if (node.type === "Sidebar" && node.props.collapsible) needsSidebarCollapse = true;
      if (node.type === "Navbar" && node.props.hasDropdown) needsNavDropdown = true;
      scanForState(node.children);
    }
  }
  scanForState(ast.components);

  if (needsModalState) {
    stateDeclarations.push('const [modalOpen, setModalOpen] = useState(false);');
    handlerDeclarations.push('const handleOpenModal = () => setModalOpen(true);');
    handlerDeclarations.push('const handleCloseModal = () => setModalOpen(false);');
  }
  if (needsSidebarCollapse) {
    stateDeclarations.push('const [sidebarCollapsed, setSidebarCollapsed] = useState(false);');
    handlerDeclarations.push('const toggleSidebar = () => setSidebarCollapsed(prev => !prev);');
  }
  if (needsNavDropdown) {
    stateDeclarations.push('const [dropdownOpen, setDropdownOpen] = useState(false);');
    handlerDeclarations.push('const toggleDropdown = () => setDropdownOpen(prev => !prev);');
  }

  function renderNode(node: UIASTNode | string, indent: number): string {
    if (typeof node === "string") {
      return `${"  ".repeat(indent)}${node}`;
    }

    // Validate component type
    if (!ALLOWED_COMPONENT_TYPES.includes(node.type)) {
      errors.push(`Unknown component: ${node.type}`);
      return `${"  ".repeat(indent)}{/* Unknown component: ${node.type} */}`;
    }

    usedComponents.add(node.type);

    // Extract and validate props
    const { sanitized, errors: propErrors, warnings: propWarnings } = validateAndClean(node);
    errors.push(...propErrors);
    warnings.push(...(propWarnings || []));

    // Check for icon and logo props
    if (sanitized.icon && typeof sanitized.icon === "string") {
      usedIcons.add(sanitized.icon as string);
    }
    if (sanitized.logo && typeof sanitized.logo === "string") {
      usedIcons.add(sanitized.logo as string);
    }

    // Build prop string
    const propParts: string[] = [];
    for (const [key, value] of Object.entries(sanitized)) {
      if (key === "children") continue; // handled via children array

      if (HANDLER_PROPS.has(key)) {
        // Map handler strings to actual function references
        const handlerVal = mapHandler(key, value as string);
        propParts.push(`${key}={${handlerVal}}`);
      } else if (key === "icon" && typeof value === "string") {
        const iconName = ICON_CONFLICTS[value as string] || value;
        propParts.push(`icon={<${iconName} className="h-4 w-4" />}`);
      } else if (key === "logo" && typeof value === "string") {
        const iconName = ICON_CONFLICTS[value as string] || value;
        propParts.push(`logo={<${iconName} className="h-5 w-5" />}`);
      } else if (key === "data" && Array.isArray(value)) {
        propParts.push(`data={${JSON.stringify(value)}}`);
      } else if (RAW_VALUE_PROPS.has(key)) {
        propParts.push(`${key}={${JSON.stringify(value)}}`);
      } else if (typeof value === "string") {
        propParts.push(`${key}="${value}"`);
      } else if (typeof value === "boolean") {
        propParts.push(value ? key : `${key}={false}`);
      } else if (typeof value === "number") {
        propParts.push(`${key}={${value}}`);
      }
    }

    const propsStr = propParts.length > 0 ? " " + propParts.join(" ") : "";
    const pad = "  ".repeat(indent);

    // Handle special override for Modal isOpen
    let finalPropsStr = propsStr;
    if (node.type === "Modal") {
      finalPropsStr = finalPropsStr.replace(/isOpen=\{[^}]*\}/, "isOpen={modalOpen}");
      if (!finalPropsStr.includes("onClose")) {
        finalPropsStr += " onClose={handleCloseModal}";
      }
    }

    // Children
    const childContent: string[] = [];

    // String children from props
    if (sanitized.children && typeof sanitized.children === "string") {
      childContent.push(`${"  ".repeat(indent + 1)}${sanitized.children}`);
    }

    // Child nodes
    for (const child of node.children) {
      childContent.push(renderNode(child, indent + 1));
    }

    if (childContent.length === 0) {
      return `${pad}<${node.type}${finalPropsStr} />`;
    }

    return [
      `${pad}<${node.type}${finalPropsStr}>`,
      ...childContent,
      `${pad}</${node.type}>`,
    ].join("\n");
  }

  function validateAndClean(node: UIASTNode): {
    sanitized: Record<string, unknown>;
    errors: string[];
    warnings?: string[];
  } {
    const result = validateNodeProps(node.type, node.props);
    if (result.valid) {
      return { sanitized: result.sanitized, errors: [], warnings: [] };
    }
    // On validation failure, still use the props but log errors
    return { sanitized: node.props, errors: result.errors, warnings: [] };
  }

  function mapHandler(key: string, value: string): string {
    // Map common handler strings to actual references
    const handlerMap: Record<string, string> = {
      "openModal": "handleOpenModal",
      "closeModal": "handleCloseModal",
      "toggleSidebar": "toggleSidebar",
      "toggleDropdown": "toggleDropdown",
    };
    return handlerMap[value] || `() => {}`;
  }

  // Generate JSX tree
  const jsxLines = ast.components.map((comp) => renderNode(comp, 2));
  const jsxBody = jsxLines.join("\n");

  // Collect imports
  const importGroups = new Map<string, Set<string>>();
  for (const comp of usedComponents) {
    const path = IMPORT_MAP[comp];
    if (path) {
      if (!importGroups.has(path)) importGroups.set(path, new Set());
      importGroups.get(path)!.add(comp);
    }
  }

  const importLines: string[] = [];

  // React hooks
  const needsState = stateDeclarations.length > 0;
  if (needsState) {
    importLines.push('import { useState } from "react";');
  }

  // Component imports
  for (const [path, comps] of importGroups) {
    const sorted = Array.from(comps).sort();
    importLines.push(`import { ${sorted.join(", ")} } from "${path}";`);
  }

  // Icon imports
  if (usedIcons.size > 0) {
    const sorted = Array.from(usedIcons).sort();
    const iconImports = sorted.map(icon => {
      if (ICON_CONFLICTS[icon]) {
        return `${icon} as ${ICON_CONFLICTS[icon]}`;
      }
      return icon;
    });
    importLines.push(`import { ${iconImports.join(", ")} } from "lucide-react";`);
  }

  // Ensure Container is imported
  if (!importGroups.has("@/components/ui-lib/Layouts")) {
    const line = importLines.findIndex((l) => l.includes("@/components/ui-lib/Layouts"));
    if (line === -1) {
      // Insert Container import
      const insertIdx = importLines.length;
      importLines.splice(insertIdx, 0, 'import { Container } from "@/components/ui-lib/Layouts";');
    }
  } else {
    importGroups.get("@/components/ui-lib/Layouts")!.add("Container");
  }

  // Rebuild with Container guaranteed
  const finalImportGroups = new Map<string, Set<string>>();
  for (const comp of [...usedComponents, "Container"]) {
    const path = IMPORT_MAP[comp];
    if (path) {
      if (!finalImportGroups.has(path)) finalImportGroups.set(path, new Set());
      finalImportGroups.get(path)!.add(comp);
    }
  }

  const finalImportLines: string[] = [];
  if (needsState) {
    finalImportLines.push('import { useState } from "react";');
  }
  for (const [path, comps] of finalImportGroups) {
    const sorted = Array.from(comps).sort();
    finalImportLines.push(`import { ${sorted.join(", ")} } from "${path}";`);
  }
  if (usedIcons.size > 0) {
    const sorted = Array.from(usedIcons).sort();
    const iconImports = sorted.map(icon => {
      if (ICON_CONFLICTS[icon]) {
        return `${icon} as ${ICON_CONFLICTS[icon]}`;
      }
      return icon;
    });
    finalImportLines.push(`import { ${iconImports.join(", ")} } from "lucide-react";`);
  }

  const stateBlock = stateDeclarations.length > 0
    ? "\n" + stateDeclarations.map((s) => "  " + s).join("\n")
    : "";

  const handlerBlock = handlerDeclarations.length > 0
    ? "\n" + handlerDeclarations.map((h) => "  " + h).join("\n")
    : "";

  const finalCode = `${finalImportLines.join("\n")}

export default function GeneratedUI() {${stateBlock}${handlerBlock}

  return (
    <Container>
${jsxBody}
    </Container>
  );
}
`;

  return {
    code: finalCode.trim(),
    errors,
    warnings,
    usedComponents: Array.from(usedComponents),
    usedIcons: Array.from(usedIcons),
  };
}
