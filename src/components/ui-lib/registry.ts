export const COMPONENT_DOCS = `
You have access to a fixed set of UI components. You must use ONLY these components.
Do NOT use standard HTML tags (div, p, h1, button) directly.
Do NOT use Tailwind classes directly. Use ONLY variant props for styling.

# Design Token Props (available on most components)
- variant: "primary" | "secondary" | "ghost" — controls color theme
- size: "sm" | "md" | "lg" — controls sizing
- elevation: 0 | 1 | 2 | 3 — controls shadow depth
- animation: "none" | "fade" | "slide" — controls entrance animation

# Available Components

1. Layouts:
   - <Box padding="none|sm|md|lg" background="default|muted|brand" elevation={0-3} animation="none|fade|slide" />
   - <Stack direction="row|column" gap="none|sm|md|lg" align="start|center|end|stretch" justify="start|center|end|between" elevation={0-3} animation="none|fade|slide" />
   - <Grid columns={1|2|3|4} gap="sm|md|lg" responsive={boolean} elevation={0-3} animation="none|fade|slide" />
   - <Container elevation={0-3} animation="none|fade|slide" />

2. Typography:
   - <Heading level={1|2|3|4} elevation={0-3} animation="none|fade|slide" />
   - <Text size="sm|md|lg" type="default|muted" elevation={0-3} animation="none|fade|slide" />

3. Primitives:
   - <Button variant="primary|secondary|outline|ghost|destructive" size="sm|md|lg|icon" elevation={0-3} animation="none|fade|slide" isLoading={boolean} />
   - <Input type="text|password|email|number" label="Label" error="Error" placeholder="..." elevation={0-3} animation="none|fade|slide" />
   - <Card variant="primary|secondary|ghost" elevation={0-3} animation="none|fade|slide">
     - <CardHeader>, <CardTitle>, <CardDescription>, <CardContent>, <CardFooter>

4. Complex:
   - <Table elevation={0-3} animation="none|fade|slide">
     - <TableHeader>, <TableBody>, <TableRow>, <TableHead>, <TableCell>, <TableFooter>, <TableCaption>
   - <Modal isOpen={boolean} onClose={fn} title="Title" variant="primary|secondary|ghost" elevation={0-3} animation="none|fade|slide" />
   - <Navbar logo={node} variant="primary|secondary|ghost" elevation={0-3} animation="none|fade|slide" hasDropdown={boolean} />
   - <Sidebar variant="primary|secondary|ghost" elevation={0-3} animation="none|fade|slide" collapsible={boolean} defaultCollapsed={boolean}>
     - <SidebarItem icon={node} isActive={boolean} />

5. Charts:
   - <BarChart title="Title" data={[{label,value}]} size="sm|md|lg" variant="primary|secondary|ghost" elevation={0-3} animation="none|fade|slide" />
   - <LineChart title="Title" data={[{label,value}]} size="sm|md|lg" variant="primary|secondary|ghost" elevation={0-3} animation="none|fade|slide" />
   - <PieChart title="Title" data={[{label,value}]} size="sm|md|lg" variant="primary|secondary|ghost" elevation={0-3} animation="none|fade|slide" />

Icons: Import from "lucide-react" (e.g., import { Home, Settings } from "lucide-react")

# FORBIDDEN:
- className prop with Tailwind classes
- style prop
- Raw HTML tags
- Creating new components
`


