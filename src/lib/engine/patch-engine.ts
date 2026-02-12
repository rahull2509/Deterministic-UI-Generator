// ============================================================
// Incremental Patch Engine
// ============================================================
// Applies PATCH operations to an existing UIAST without
// regenerating the entire tree. Only affected subtrees change.
// ============================================================

import { UIAST, UIASTNode, Patch } from "@/lib/schema/ui-ast";

export interface PatchResult {
  success: boolean;
  ast: UIAST;
  appliedPatches: number;
  errors: string[];
}

/**
 * Apply a list of patches to an existing AST.
 * Patches are applied sequentially.
 */
export function applyPatches(ast: UIAST, patches: Patch[]): PatchResult {
  let current = structuredClone(ast);
  const errors: string[] = [];
  let appliedCount = 0;

  for (const patch of patches) {
    try {
      current = applySinglePatch(current, patch);
      appliedCount++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Patch "${patch.action}" at "${patch.targetPath}": ${msg}`);
    }
  }

  return {
    success: errors.length === 0,
    ast: current,
    appliedPatches: appliedCount,
    errors,
  };
}

/**
 * Apply a single patch to the AST.
 */
function applySinglePatch(ast: UIAST, patch: Patch): UIAST {
  const { action, targetPath, component, props } = patch;

  switch (action) {
    case "add":
      return addNode(ast, targetPath, component!);
    case "update":
      return updateNode(ast, targetPath, component, props);
    case "remove":
      return removeNode(ast, targetPath);
    default:
      throw new Error(`Unknown patch action: ${action}`);
  }
}

/**
 * Parse a target path like "root.children[2]" or "root.children[0].children[1]"
 * into an array of steps to navigate the AST.
 */
interface PathStep {
  kind: "children";
  index: number;
}

function parsePath(targetPath: string): PathStep[] {
  const steps: PathStep[] = [];
  // Match patterns like children[0], children[2]
  const regex = /children\[(\d+)\]/g;
  let match;

  while ((match = regex.exec(targetPath)) !== null) {
    steps.push({ kind: "children", index: parseInt(match[1], 10) });
  }

  return steps;
}

/**
 * Navigate to the parent of the target and the target index.
 */
function navigateToTarget(
  ast: UIAST,
  targetPath: string
): { parent: { children: (UIASTNode | string)[] }; index: number } {
  const steps = parsePath(targetPath);

  if (steps.length === 0) {
    throw new Error(`Invalid target path: "${targetPath}"`);
  }

  // The AST root has a `components` array as the top-level children
  let current: { children: (UIASTNode | string)[] } = {
    children: ast.components as (UIASTNode | string)[],
  };

  // Navigate to the parent (all but last step)
  for (let i = 0; i < steps.length - 1; i++) {
    const step = steps[i];
    const child = current.children[step.index];
    if (typeof child === "string") {
      throw new Error(
        `Path step ${i} at index ${step.index} points to a text node, not a component`
      );
    }
    if (!child) {
      throw new Error(
        `Path step ${i} at index ${step.index} is out of bounds (${current.children.length} children)`
      );
    }
    current = child;
  }

  const lastStep = steps[steps.length - 1];
  return { parent: current, index: lastStep.index };
}

function addNode(ast: UIAST, targetPath: string, component: UIASTNode): UIAST {
  const result = structuredClone(ast);
  const steps = parsePath(targetPath);

  if (steps.length === 0) {
    // Add to root
    result.components.push(component);
    return result;
  }

  const { parent, index } = navigateToTarget(result, targetPath);

  // Insert after the given index (or at end if index === length)
  if (index >= parent.children.length) {
    parent.children.push(component);
  } else {
    parent.children.splice(index + 1, 0, component);
  }

  // Sync components back
  result.components = parent.children.filter(
    (c): c is UIASTNode => typeof c !== "string"
  );

  return result;
}

function updateNode(
  ast: UIAST,
  targetPath: string,
  component?: UIASTNode,
  props?: Record<string, unknown>
): UIAST {
  const result = structuredClone(ast);
  const { parent, index } = navigateToTarget(result, targetPath);

  const existing = parent.children[index];
  if (typeof existing === "string") {
    throw new Error(`Cannot update a text node at "${targetPath}"`);
  }
  if (!existing) {
    throw new Error(`No node at "${targetPath}"`);
  }

  if (component) {
    // Replace entire node
    parent.children[index] = component;
  } else if (props) {
    // Merge props
    existing.props = { ...existing.props, ...props };
  }

  return result;
}

function removeNode(ast: UIAST, targetPath: string): UIAST {
  const result = structuredClone(ast);
  const { parent, index } = navigateToTarget(result, targetPath);

  if (index >= parent.children.length) {
    throw new Error(`No node at index ${index} in "${targetPath}"`);
  }

  parent.children.splice(index, 1);
  return result;
}

/**
 * Serialize AST to a compact JSON for diffing or display.
 */
export function serializeAST(ast: UIAST): string {
  return JSON.stringify(ast, null, 2);
}

/**
 * Create an empty AST.
 */
export function createEmptyAST(): UIAST {
  return {
    layout: "Stack",
    theme: "light",
    components: [],
  };
}
