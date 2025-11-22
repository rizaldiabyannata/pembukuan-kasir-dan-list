# Loading State Animations

This document describes the animation system for loading states throughout the application.

## Animation Specifications

All animations follow these timing specifications from the design document:

- **Content fade-in**: 200ms
- **Overlay fade-out**: 150ms
- **Button state transitions**: 200ms
- **Staggered item delay**: 50ms per item
- **Layout stability**: Maximum 5px shift during transitions

## Components with Animations

### 1. LoadingButton

Smooth transitions for button state changes with spinner and text animations.

```jsx
import { LoadingButton } from "@/components/ui/loading-button";

<LoadingButton
  isLoading={isSubmitting}
  loadingText="Menyimpan..."
  onClick={handleSubmit}
>
  Simpan
</LoadingButton>;
```

**Animation features:**

- 200ms transition for all state changes
- Smooth opacity transitions for spinner and text
- Maintains button dimensions to prevent layout shift

### 2. LoadingOverlay

Fade-in/fade-out overlay for dialogs and modals.

```jsx
import { LoadingOverlay } from "@/components/ui/loading-overlay";

<div className="relative">
  <LoadingOverlay isVisible={isProcessing} message="Memproses..." />
  {/* Your content */}
</div>;
```

**Animation features:**

- 150ms fade-out when closing
- Smooth fade-in when appearing
- Prevents interaction during loading

### 3. TableSkeleton

Skeleton placeholder with staggered row animations.

```jsx
import { TableSkeleton } from "@/components/ui/table-skeleton";

{
  isLoading ? (
    <TableSkeleton rows={5} columns={6} />
  ) : (
    <Table>{/* Your table content */}</Table>
  );
}
```

**Animation features:**

- 200ms fade-in for container
- 50ms staggered delay per row
- Smooth transition to actual content

### 4. CardSkeleton

Skeleton placeholder for card grids with staggered animations.

```jsx
import { CardSkeleton } from "@/components/ui/card-skeleton";

{
  isLoading ? (
    <CardSkeleton count={6} variant="default" />
  ) : (
    <div className="grid grid-cols-3 gap-4">{/* Your cards */}</div>
  );
}
```

**Animation features:**

- 200ms fade-in for container
- 50ms staggered delay per card
- Maintains grid layout dimensions

### 5. ChartSkeleton

Skeleton placeholder for charts with animated stats.

```jsx
import { ChartSkeleton } from "@/components/ui/chart-skeleton";

{
  isLoading ? <ChartSkeleton showStats={true} /> : <Chart data={chartData} />;
}
```

**Animation features:**

- 200ms fade-in for chart container
- 50ms staggered delay for stats items
- Smooth transition to actual chart

### 6. FadeInContent

Wrapper component for smooth content transitions.

```jsx
import { FadeInContent } from "@/components/ui/fade-in-content";

<FadeInContent isLoading={isLoading} skeleton={<TableSkeleton />}>
  <Table data={data} />
</FadeInContent>;
```

**Animation features:**

- 200ms fade-in when content loads
- Optional delay before animation starts
- Automatic skeleton display during loading

### 7. StaggeredList

Component for lists with staggered item animations.

```jsx
import { StaggeredList } from "@/components/ui/staggered-list";

<StaggeredList staggerDelay={50}>
  {items.map((item) => (
    <div key={item.id}>{item.name}</div>
  ))}
</StaggeredList>;
```

**Animation features:**

- 50ms delay between each item
- 200ms fade-in per item
- Configurable stagger delay

## CSS Classes Used

The animation system uses Tailwind CSS utilities from `tw-animate-css`:

- `animate-in` - Triggers entrance animation
- `fade-in` - Fade-in effect
- `duration-200` - 200ms animation duration
- `duration-150` - 150ms animation duration
- `transition-opacity` - Smooth opacity transitions
- `transition-all` - Smooth transitions for all properties

## Layout Stability

All components maintain layout stability during transitions:

1. **Skeleton dimensions match content**: Skeletons are sized to match expected content
2. **Fixed container heights**: Containers maintain consistent heights
3. **No layout shift**: Maximum 5px shift tolerance during transitions
4. **Smooth replacements**: Content fades in at the same position as skeleton

## Accessibility

All animated components include proper ARIA attributes:

- `aria-busy="true"` during loading
- `aria-live` regions for announcements
- `aria-label` describing loading state
- Screen reader announcements for state changes

## Performance

Animation performance guidelines:

- All animations maintain 60fps
- CSS transitions used instead of JavaScript animations
- Hardware acceleration via transform properties
- Minimal repaints and reflows

## Browser Compatibility

Animations are tested and work in:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Examples

### Complete Page Loading Flow

```jsx
function MyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData().then((result) => {
      setData(result);
      setIsLoading(false);
    });
  }, []);

  return (
    <div>
      {isLoading ? (
        <TableSkeleton rows={10} columns={5} />
      ) : (
        <div className="animate-in fade-in duration-200">
          <Table data={data} />
        </div>
      )}
    </div>
  );
}
```

### Form Submission with Loading

```jsx
function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await saveData();
      toast.success("Berhasil disimpan!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <LoadingOverlay isVisible={isSubmitting} message="Menyimpan..." />

      {/* Form fields */}

      <LoadingButton
        type="submit"
        isLoading={isSubmitting}
        loadingText="Menyimpan..."
      >
        Simpan
      </LoadingButton>
    </form>
  );
}
```

### Item-Specific Loading

```jsx
function ItemList() {
  const { executeAction, isActionLoading } = useActionLoading();

  const handleDelete = (id) => {
    executeAction(
      `delete-${id}`,
      async () => {
        await deleteItem(id);
      },
      {
        successMessage: "Item berhasil dihapus",
      }
    );
  };

  return (
    <StaggeredList>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <span>{item.name}</span>
          <LoadingButton
            isLoading={isActionLoading(`delete-${item.id}`)}
            onClick={() => handleDelete(item.id)}
            variant="destructive"
            size="sm"
          >
            Hapus
          </LoadingButton>
        </div>
      ))}
    </StaggeredList>
  );
}
```

## Testing Animations

To test animations:

1. **Visual inspection**: Check that animations are smooth and timing is correct
2. **Performance**: Use browser DevTools to verify 60fps
3. **Accessibility**: Test with screen readers (NVDA, JAWS, VoiceOver)
4. **Layout stability**: Measure layout shift during transitions
5. **Browser compatibility**: Test in all supported browsers

## Troubleshooting

### Animations not working

- Verify `tw-animate-css` is imported in `globals.css`
- Check that Tailwind CSS is properly configured
- Ensure components have proper class names

### Janky animations

- Check for expensive operations during animation
- Verify 60fps in browser DevTools
- Use CSS transforms instead of layout properties

### Layout shift

- Ensure skeleton dimensions match content
- Use fixed heights where appropriate
- Test with different content sizes
