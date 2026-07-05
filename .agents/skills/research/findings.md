# Minimal & Compact UI Component Patterns

## Research Findings for Next.js + Tailwind CSS + Radix UI

---

## 1. Radix UI Primitives

### Available Primitives

Radix UI provides 50+ unstyled, accessible React component packages. Key primitives for data display and compact layouts:

**Data Display & Interaction:**
- **Table** - Not available as a primitive (use HTML `<table>` or TanStack Table)
- **Dialog** - Modal and non-modal modes with fine-grained focus control
- **Dropdown Menu** - Submenus, checkable items, collision handling, typeahead support
- **Popover** - Fine-grained focus control, collision-aware positioning
- **Hover Card** - For compact data previews on hover
- **Tooltip** - For compact information display
- **Scroll Area** - Custom cross-browser scrollbar styling
- **Tabs** - Arrow key navigation, horizontal/vertical orientation
- **Accordion** - Collapse/expand for compact content organization

**Form Controls:**
- **Select** - Dropdown selection with keyboard navigation
- **Checkbox** - Binary state toggle
- **Switch** - Toggle between checked/unchecked
- **Slider** - Value range input with multiple thumbs
- **Radio Group** - Single selection from options
- **Toggle Group** - Two-state button sets

### Architecture

- **Unstyled** - No CSS specificity wars; full styling control
- **Composable** - Granular access to each component part
- **Accessible** - WAI-ARIA compliant out of the box
- **Incremental adoption** - Each component is independently versioned

**Source:** [Radix Primitives Documentation](https://www.radix-ui.com/primitives)

---

## 2. shadcn/ui Component Patterns

### Core Philosophy

shadcn/ui is **not a library** but a **component distribution system**. Components are copied directly into your project, giving you full ownership and customization control.

**Key Principles:**
- **Open Code** - Top layer of component code is open for modification
- **Composition** - Common, composable interface across all components
- **Distribution** - Flat-file schema with CLI tool
- **Beautiful Defaults** - Carefully chosen styles out-of-the-box
- **AI-Ready** - Open code for LLMs to read and improve

### Data Table Pattern

shadcn/ui provides a **guide** (not a single component) for building data tables:

**Architecture:**
- Uses **TanStack Table** (headless UI) for logic
- Uses shadcn `<Table />` component for markup
- Supports: sorting, filtering, pagination, row selection, column visibility

**Base Table Component:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[100px]">Invoice</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">INV001</TableCell>
      <TableCell>Paid</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Installation:**
```bash
pnpm dlx shadcn@latest add table
pnpm add @tanstack/react-table
```

### Available Components for Compact Layouts

From the official shadcn/ui component list:
- **Table** - Basic table markup
- **Data Table** - Complex data grids with TanStack Table
- **Card** - Container component
- **Badge** - Compact status indicators
- **Separator** - Visual dividers
- **Tabs** - Compact navigation
- **Accordion** - Collapsible sections
- **Collapsible** - Show/hide content
- **Scroll Area** - Custom scrollbars
- **Resizable** - Adjustable panel sizes

**Source:** [shadcn/ui Documentation](https://ui.shadcn.com/docs/components)

---

## 3. Tailwind CSS Spacing & Sizing Conventions

### Default Spacing Scale

Tailwind uses a **proportional spacing scale** where 1 unit = 0.25rem (4px):

| Name | Size | Pixels |
|------|------|--------|
| 0 | 0px | 0px |
| px | 1px | 1px |
| 0.5 | 0.125rem | 2px |
| 1 | 0.25rem | 4px |
| 1.5 | 0.375rem | 6px |
| 2 | 0.5rem | 8px |
| 2.5 | 0.625rem | 10px |
| 3 | 0.75rem | 12px |
| 3.5 | 0.875rem | 14px |
| 4 | 1rem | 16px |
| 5 | 1.25rem | 20px |
| 6 | 1.5rem | 24px |
| 8 | 2rem | 32px |
| 10 | 2.5rem | 40px |
| 12 | 3rem | 48px |

**Source:** [Tailwind CSS Spacing Documentation](https://tailwindcss.com/docs/padding)

### Compact Layout Conventions

**For Dense Information Display:**
- Use `p-1` to `p-2` (4-8px) for compact padding
- Use `gap-1` to `gap-2` (4-8px) for tight gaps
- Use `text-xs` to `text-sm` (12-14px) for compact text
- Use `h-8` to `h-10` (32-40px) for compact heights

**Utility Classes for Compact Layouts:**
- `p-1` = 4px padding
- `p-2` = 8px padding
- `px-2 py-1` = 8px horizontal, 4px vertical
- `gap-1` = 4px gap
- `gap-2` = 8px gap
- `text-xs` = 12px font size
- `text-sm` = 14px font size
- `leading-tight` = 1.25 line height
- `leading-tighter` = 1.375 line height

**Source:** [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 4. Apple Human Interface Guidelines (HIG)

### Design Principles

Apple's HIG is built on three core principles:
1. **Clarity** - Content should be legible at every size
2. **Deference** - UI should support content, not compete with it
3. **Depth** - Visual layers and realistic motion communicate hierarchy

### Density Guidelines

**Minimum Touch Targets:**
- **44×44 points** minimum for interactive elements
- Research shows smaller targets increase tap error rates by 25%+

**Typography Scale (Dynamic Type):**
- Body: 17pt (default)
- Large Title: 34pt
- Headline: 20pt
- Subheadline: 15pt
- Footnote: 13pt
- Caption 1: 12pt
- Caption 2: 11pt

**Spacing:**
- Generous whitespace is a hallmark of Apple design
- Content is given room to breathe
- Visual hierarchy through spacing, not lines

**Source:** [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)

### Compact Layout Considerations

For dense information display while respecting Apple guidelines:
- Use **minimum 44pt** for tappable elements
- Maintain **clear visual hierarchy** through typography
- Use **semantic colors** that auto-adapt to light/dark mode
- Consider **Dynamic Type** support for accessibility

---

## 5. Material Design Density Guidelines

### Information Density

**Definition:** The amount of content (text, images, videos) in a given space.

**When to Use High Density:**
- Data tables with lots of information to scan
- Financial portals and dashboards
- News websites with dense content
- Power user interfaces

**When NOT to Use High Density:**
- Focused tasks (date pickers, dropdowns)
- Alerts and messaging (dialogs, snackbars)
- Mobile-first interfaces

### Component Density Scale

Material Design uses a **density scale** starting at 0 (default):
- **0** - Default density
- **-1** - Higher density (reduced padding by 4dp)
- **-2** - Even higher density
- **-3** - Maximum density

**Height Calculation Formula:**
```
component height = default height - (density scale × 4dp)
```

**Example:**
- Button default: 48dp height
- Button at -1: 44dp height
- Button at -2: 40dp height
- Button at -3: 36dp height (minimum)

### Data Table Specifications

**Row Heights:**
- Default row height: **52dp**
- Header row height: **56dp** (4dp taller than data rows)

**Padding:**
- Column padding: **32dp** minimum between columns
- Header name padding: **16dp** on left and right

**Source:** [Material Design Density Guidelines](https://m2.material.io/design/layout/applying-density.html)

---

## 6. Calendar & Schedule Component Patterns

### React Calendar Libraries

**1. react-calendar**
- Simple, flexible date picker
- Supports days to decades views
- Easy to style
- GitHub: 3.4k stars

**2. react-big-calendar**
- Styled after Google Calendar
- Event management with drag-and-drop
- Integrates with Moment.js
- GitHub: 7.4k stars

**3. FullCalendar**
- Most popular JavaScript calendar
- Multiple view types (day, week, month, year, agenda)
- React component available
- Extensive customization

**4. Schedule-X**
- Modern React calendar component
- Views: Day, Week, Month Grid, Month Agenda, Week Agenda
- Custom components for events
- Responsive design

**5. DayPilot**
- Feature-rich scheduling library
- Resources view (multiple columns)
- Drag and drop support
- Fixed column width for large datasets

### Compact Calendar Patterns

**Mini Calendar + Agenda:**
- Show compact month calendar at top
- Agenda list below for events
- Tapping a day scrolls to events

**Day View (Mobile):**
- Switch from weekly to daily view on mobile
- Horizontal swipe navigation between days
- Preserves time-slot detail

**Week View (Desktop):**
- 7-day columns with hourly rows
- Event overlap handling with column-based layout
- Progressive rendering for large datasets

### Event Layout Algorithm

For overlapping events in calendar views:

1. Sort events by start time, then duration
2. Place each event in the first available column
3. Expand events to fill remaining space
4. Handle overnight schedules with custom start/end hours

**Source:** [Schedule-X Documentation](https://schedule-x.dev/docs/frameworks/react)

---

## 7. Patterns for Compact Data Displays

### Data Table Density

**Three Density Levels:**

| Level | Row Height | Use Case |
|-------|------------|----------|
| **Compact** | 32-40px | Power users, analysts, ops teams |
| **Comfortable** | 48-52px | Default for mixed audiences |
| **Spacious** | 56-64px | Touch-first, casual contexts |

### Vertical Density Techniques

**Reducing Vertical Space:**
- Use `py-1` or `py-2` instead of `py-3` or `py-4`
- Use `text-xs` or `text-sm` for tighter text
- Use `leading-tight` for reduced line height
- Use `h-8` to `h-10` for compact row heights

**Horizontal Density:**
- Use `px-2` to `px-3` for compact cell padding
- Use `gap-1` to `gap-2` between columns
- Right-align numbers, left-align text
- Use consistent column widths

### Compact Layout Patterns

**1. Stacked Cards:**
```tsx
<div className="space-y-1">
  <Card className="p-2">
    <CardContent className="p-0 text-xs">
      Content here
    </CardContent>
  </Card>
</div>
```

**2. Compact Table:**
```tsx
<Table>
  <TableHeader>
    <TableRow className="h-8">
      <TableHead className="py-1 text-xs">Header</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="h-8">
      <TableCell className="py-1 text-xs">Content</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**3. Inline Tags:**
```tsx
<div className="flex flex-wrap gap-1">
  <Badge className="px-1 py-0 text-xs">Tag 1</Badge>
  <Badge className="px-1 py-0 text-xs">Tag 2</Badge>
</div>
```

---

## 8. Implementation Recommendations

### For Next.js + Tailwind + Radix UI Stack

**Data Tables:**
1. Use TanStack Table for logic
2. Use shadcn Table component for markup
3. Apply compact spacing: `py-1`, `px-2`, `text-xs`
4. Support density toggle (compact/comfortable/spacious)

**Calendars:**
1. Use Schedule-X or FullCalendar for React
2. Implement responsive views (day on mobile, week on desktop)
3. Use mini calendar + agenda pattern for mobile
4. Support custom event components for density control

**Compact Layouts:**
1. Use Tailwind's spacing scale consistently
2. Apply `py-1` to `py-2` for compact padding
3. Use `gap-1` to `gap-2` for tight gaps
4. Use `text-xs` to `text-sm` for dense text
5. Maintain minimum 32px height for interactive elements

### Accessibility Considerations

- Maintain minimum **44px** touch targets (Apple HIG) or **48px** (Material Design)
- Use semantic HTML for tables (`<table>`, `<thead>`, `<tbody>`)
- Ensure sufficient color contrast (4.5:1 minimum)
- Support keyboard navigation
- Provide screen reader labels

---

## Sources Cited

1. [Radix Primitives Documentation](https://www.radix-ui.com/primitives) - Official Radix UI documentation
2. [shadcn/ui Documentation](https://ui.shadcn.com/docs/components) - Official shadcn/ui component documentation
3. [Tailwind CSS Spacing](https://tailwindcss.com/docs/padding) - Official Tailwind CSS documentation
4. [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines) - Official Apple design documentation
5. [Material Design Density](https://m2.material.io/design/layout/applying-density.html) - Official Material Design documentation
6. [Schedule-X Documentation](https://schedule-x.dev/docs/frameworks/react) - Official Schedule-X React documentation
7. [TanStack Table Documentation](https://tanstack.com/table) - Official TanStack Table documentation
8. [FullCalendar Documentation](https://fullcalendar.io/) - Official FullCalendar documentation
