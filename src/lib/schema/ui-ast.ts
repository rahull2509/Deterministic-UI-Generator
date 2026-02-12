import { z } from "zod";

// ============================================================
// Design Tokens - deterministic, controlled token values
// ============================================================

export const VariantEnum = z.enum(["primary", "secondary", "ghost"]);
export const SizeEnum = z.enum(["sm", "md", "lg"]);
export const ElevationEnum = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
export const AnimationEnum = z.enum(["none", "fade", "slide"]);
export const ThemeEnum = z.enum(["light", "dark"]);

// ============================================================
// Component-specific prop schemas
// ============================================================

const ButtonVariantEnum = z.enum(["primary", "secondary", "outline", "ghost", "destructive"]);
const ButtonSizeEnum = z.enum(["sm", "md", "lg", "icon"]);

const ButtonPropsSchema = z.object({
  variant: ButtonVariantEnum.optional().default("primary"),
  size: ButtonSizeEnum.optional().default("md"),
  elevation: ElevationEnum.optional().default(0),
  animation: AnimationEnum.optional().default("none"),
  isLoading: z.boolean().optional().default(false),
  onClick: z.string().optional(), // handler name reference
  children: z.string().optional(),
  disabled: z.boolean().optional(),
}).strict();

const InputPropsSchema = z.object({
  type: z.enum(["text", "password", "email", "number"]).optional().default("text"),
  label: z.string().optional(),
  error: z.string().optional(),
  placeholder: z.string().optional(),
  elevation: ElevationEnum.optional().default(0),
  animation: AnimationEnum.optional().default("none"),
}).strict();

const CardPropsSchema = z.object({
  variant: VariantEnum.optional().default("primary"),
  elevation: ElevationEnum.optional().default(1),
  animation: AnimationEnum.optional().default("none"),
}).strict();

const CardHeaderPropsSchema = z.object({}).strict();
const CardTitlePropsSchema = z.object({
  children: z.string().optional(),
}).strict();
const CardDescriptionPropsSchema = z.object({
  children: z.string().optional(),
}).strict();
const CardContentPropsSchema = z.object({}).strict();
const CardFooterPropsSchema = z.object({}).strict();

const BoxPropsSchema = z.object({
  padding: z.enum(["none", "sm", "md", "lg"]).optional().default("md"),
  background: z.enum(["default", "muted", "brand"]).optional().default("default"),
  elevation: ElevationEnum.optional().default(0),
  animation: AnimationEnum.optional().default("none"),
}).strict();

const StackPropsSchema = z.object({
  direction: z.enum(["row", "column"]).optional().default("column"),
  gap: z.enum(["none", "sm", "md", "lg"]).optional().default("md"),
  align: z.enum(["start", "center", "end", "stretch"]).optional().default("stretch"),
  justify: z.enum(["start", "center", "end", "between"]).optional().default("start"),
  elevation: ElevationEnum.optional().default(0),
  animation: AnimationEnum.optional().default("none"),
}).strict();

const GridPropsSchema = z.object({
  columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional().default(1),
  gap: z.enum(["sm", "md", "lg"]).optional().default("md"),
  responsive: z.boolean().optional().default(true),
  elevation: ElevationEnum.optional().default(0),
  animation: AnimationEnum.optional().default("none"),
}).strict();

const ContainerPropsSchema = z.object({
  elevation: ElevationEnum.optional().default(0),
  animation: AnimationEnum.optional().default("none"),
}).strict();

const HeadingPropsSchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional().default(1),
  children: z.string().optional(),
  elevation: ElevationEnum.optional().default(0),
  animation: AnimationEnum.optional().default("none"),
}).strict();

const TextPropsSchema = z.object({
  size: SizeEnum.optional().default("md"),
  type: z.enum(["default", "muted"]).optional().default("default"),
  children: z.string().optional(),
  elevation: ElevationEnum.optional().default(0),
  animation: AnimationEnum.optional().default("none"),
}).strict();

const ModalPropsSchema = z.object({
  isOpen: z.boolean().optional().default(false),
  onClose: z.string().optional(),
  title: z.string().optional(),
  variant: VariantEnum.optional().default("primary"),
  elevation: ElevationEnum.optional().default(2),
  animation: AnimationEnum.optional().default("fade"),
}).strict();

const NavbarPropsSchema = z.object({
  logo: z.string().optional(),
  variant: VariantEnum.optional().default("primary"),
  elevation: ElevationEnum.optional().default(1),
  animation: AnimationEnum.optional().default("none"),
  hasDropdown: z.boolean().optional().default(false),
}).strict();

const SidebarPropsSchema = z.object({
  variant: VariantEnum.optional().default("primary"),
  elevation: ElevationEnum.optional().default(0),
  animation: AnimationEnum.optional().default("none"),
  collapsible: z.boolean().optional().default(false),
  defaultCollapsed: z.boolean().optional().default(false),
}).strict();

const SidebarItemPropsSchema = z.object({
  isActive: z.boolean().optional().default(false),
  icon: z.string().optional(), // icon name from lucide-react
  children: z.string().optional(),
}).strict();

const ChartDataSchema = z.array(z.object({
  label: z.string(),
  value: z.number(),
}));

const BarChartPropsSchema = z.object({
  title: z.string().optional(),
  data: ChartDataSchema.optional(),
  size: SizeEnum.optional().default("md"),
  variant: VariantEnum.optional().default("primary"),
  elevation: ElevationEnum.optional().default(0),
  animation: AnimationEnum.optional().default("fade"),
}).strict();

const LineChartPropsSchema = z.object({
  title: z.string().optional(),
  data: ChartDataSchema.optional(),
  size: SizeEnum.optional().default("md"),
  variant: VariantEnum.optional().default("primary"),
  elevation: ElevationEnum.optional().default(0),
  animation: AnimationEnum.optional().default("fade"),
}).strict();

const PieChartPropsSchema = z.object({
  title: z.string().optional(),
  data: ChartDataSchema.optional(),
  size: SizeEnum.optional().default("md"),
  variant: VariantEnum.optional().default("primary"),
  elevation: ElevationEnum.optional().default(0),
  animation: AnimationEnum.optional().default("fade"),
}).strict();

const TablePropsSchema = z.object({
  elevation: ElevationEnum.optional().default(0),
  animation: AnimationEnum.optional().default("none"),
}).strict();
const TableHeaderPropsSchema = z.object({}).strict();
const TableBodyPropsSchema = z.object({}).strict();
const TableRowPropsSchema = z.object({}).strict();
const TableHeadPropsSchema = z.object({ children: z.string().optional() }).strict();
const TableCellPropsSchema = z.object({ children: z.string().optional() }).strict();
const TableFooterPropsSchema = z.object({}).strict();
const TableCaptionPropsSchema = z.object({ children: z.string().optional() }).strict();

// ============================================================
// Component Registry Schema Map
// ============================================================

export const COMPONENT_PROP_SCHEMAS: Record<string, z.ZodTypeAny> = {
  Button: ButtonPropsSchema,
  Input: InputPropsSchema,
  Card: CardPropsSchema,
  CardHeader: CardHeaderPropsSchema,
  CardTitle: CardTitlePropsSchema,
  CardDescription: CardDescriptionPropsSchema,
  CardContent: CardContentPropsSchema,
  CardFooter: CardFooterPropsSchema,
  Box: BoxPropsSchema,
  Stack: StackPropsSchema,
  Grid: GridPropsSchema,
  Container: ContainerPropsSchema,
  Heading: HeadingPropsSchema,
  Text: TextPropsSchema,
  Modal: ModalPropsSchema,
  Navbar: NavbarPropsSchema,
  Sidebar: SidebarPropsSchema,
  SidebarItem: SidebarItemPropsSchema,
  BarChart: BarChartPropsSchema,
  LineChart: LineChartPropsSchema,
  PieChart: PieChartPropsSchema,
  Table: TablePropsSchema,
  TableHeader: TableHeaderPropsSchema,
  TableBody: TableBodyPropsSchema,
  TableRow: TableRowPropsSchema,
  TableHead: TableHeadPropsSchema,
  TableCell: TableCellPropsSchema,
  TableFooter: TableFooterPropsSchema,
  TableCaption: TableCaptionPropsSchema,
};

export const ALLOWED_COMPONENT_TYPES = Object.keys(COMPONENT_PROP_SCHEMAS);

// ============================================================
// UI AST Node Schema
// ============================================================

export interface UIASTNode {
  type: string;
  props: Record<string, unknown>;
  children: (UIASTNode | string)[];
}

export const UIASTNodeSchema: z.ZodType<UIASTNode> = z.lazy(() =>
  z.object({
    type: z.string().refine(
      (t) => ALLOWED_COMPONENT_TYPES.includes(t),
      { message: `Unknown component type. Allowed: ${ALLOWED_COMPONENT_TYPES.join(", ")}` }
    ),
    props: z.record(z.string(), z.unknown()).default({}),
    children: z.array(z.union([z.lazy(() => UIASTNodeSchema), z.string()])).default([]),
  })
);

// ============================================================
// Full UI AST (top-level plan output)
// ============================================================

export const LayoutEnum = z.enum([
  "Stack",
  "Grid",
  "Sidebar",
  "Dashboard",
  "Form",
  "Hero",
  "Split",
  "Full",
]);

export const UIASTSchema = z.object({
  layout: LayoutEnum,
  theme: ThemeEnum.optional().default("light"),
  components: z.array(UIASTNodeSchema),
});

export type UIAST = z.infer<typeof UIASTSchema>;

// ============================================================
// Patch schema for incremental edits (Phase 4)
// ============================================================

export const PatchActionEnum = z.enum(["add", "update", "remove"]);

export const PatchSchema = z.object({
  action: PatchActionEnum,
  targetPath: z.string(),
  component: UIASTNodeSchema.optional(),
  props: z.record(z.string(), z.unknown()).optional(),
});

export type Patch = z.infer<typeof PatchSchema>;

export const PatchPlanSchema = z.object({
  modificationType: z.literal("patch"),
  patches: z.array(PatchSchema),
  reasoning: z.string(),
});

export type PatchPlan = z.infer<typeof PatchPlanSchema>;

// ============================================================
// Combined Planner Output
// ============================================================

export const PlannerOutputSchema = z.discriminatedUnion("modificationType", [
  z.object({
    modificationType: z.literal("new"),
    layout: LayoutEnum,
    theme: ThemeEnum.optional().default("light"),
    components: z.array(UIASTNodeSchema),
    reasoning: z.string(),
  }),
  z.object({
    modificationType: z.literal("patch"),
    patches: z.array(PatchSchema),
    reasoning: z.string(),
  }),
]);

export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;

// ============================================================
// Validation helpers
// ============================================================

export interface ASTValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedAST?: UIAST;
}

/**
 * Deep-validates a UI AST, checking each node's type + props against the registry schema.
 */
export function validateUIAST(ast: unknown): ASTValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Top-level parse
  const topParse = UIASTSchema.safeParse(ast);
  if (!topParse.success) {
    return {
      valid: false,
      errors: topParse.error.issues.map(
        (i) => `[${i.path.join(".")}] ${i.message}`
      ),
      warnings,
    };
  }

  const parsed = topParse.data;

  // Recursively validate each node's props
  function validateNode(node: UIASTNode, path: string) {
    const schema = COMPONENT_PROP_SCHEMAS[node.type];
    if (!schema) {
      errors.push(`${path}: Unknown component "${node.type}"`);
      return;
    }

    const propResult = schema.safeParse(node.props);
    if (!propResult.success) {
      for (const issue of propResult.error.issues) {
        if (issue.code === "unrecognized_keys") {
          warnings.push(
            `${path}.props: Unknown prop(s) ${(issue as any).keys?.join(", ")} on <${node.type}> — stripped`
          );
        } else {
          errors.push(
            `${path}.props.${issue.path.join(".")}: ${issue.message}`
          );
        }
      }
    }

    // Validate children recursively
    node.children.forEach((child, i) => {
      if (typeof child !== "string") {
        validateNode(child, `${path}.children[${i}]`);
      }
    });
  }

  parsed.components.forEach((comp, i) => {
    validateNode(comp, `components[${i}]`);
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedAST: parsed,
  };
}

/**
 * Validates a single AST node's props, stripping unknowns via passthrough then strict parse.
 * Returns sanitized props or null.
 */
export function validateNodeProps(
  type: string,
  props: Record<string, unknown>
): { valid: boolean; sanitized: Record<string, unknown>; errors: string[] } {
  const schema = COMPONENT_PROP_SCHEMAS[type];
  if (!schema) {
    return { valid: false, sanitized: {}, errors: [`Unknown component: ${type}`] };
  }
  const result = schema.safeParse(props);
  if (result.success) {
    return { valid: true, sanitized: result.data as Record<string, unknown>, errors: [] };
  }
  return {
    valid: false,
    sanitized: props,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}
