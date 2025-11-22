# Accessibility Features for Loading States

This document describes the accessibility features implemented for loading states throughout the application.

## Overview

All loading states in the application include proper ARIA attributes and screen reader announcements to ensure accessibility for users with disabilities.

## Components with Accessibility Features

### 1. LoadingButton

**ARIA Attributes:**

- `aria-busy="true"` when loading
- Button is automatically disabled during loading
- Maintains button dimensions to prevent layout shift

**Usage:**

```jsx
<LoadingButton isLoading={isLoading} loadingText="Menyimpan...">
  Simpan
</LoadingButton>
```

### 2. TableSkeleton

**ARIA Attributes:**

- `role="status"` - Indicates loading status
- `aria-busy="true"` - Indicates content is loading
- `aria-label="Memuat data tabel..."` - Describes what is loading

**Usage:**

```jsx
<TableSkeleton rows={5} columns={6} showHeader={true} />
```

### 3. CardSkeleton

**ARIA Attributes:**

- `role="status"` - Indicates loading status
- `aria-busy="true"` - Indicates content is loading
- `aria-label="Memuat data kartu..."` - Describes what is loading

**Usage:**

```jsx
<CardSkeleton count={6} variant="default" />
```

### 4. ChartSkeleton

**ARIA Attributes:**

- `role="status"` - Indicates loading status
- `aria-busy="true"` - Indicates content is loading
- `aria-label="Memuat data chart"` - Describes what is loading
- Individual skeleton elements have descriptive labels

**Usage:**

```jsx
<ChartSkeleton variant="bar" showStats={true} />
```

### 5. LoadingOverlay

**ARIA Attributes:**

- `role="status"` - Indicates loading status
- `aria-live="polite"` - Announces loading to screen readers
- `aria-busy="true"` - Indicates content is loading
- `aria-label` - Contains the loading message

**Usage:**

```jsx
<LoadingOverlay isVisible={isLoading} message="Memproses..." />
```

### 6. SkeletonLoader

**ARIA Attributes:**

- `role="status"` - Indicates loading status
- `aria-busy="true"` - Indicates content is loading
- `aria-label` - Auto-generated based on variant or custom

**Usage:**

```jsx
<SkeletonLoader variant="card" ariaLabel="Memuat informasi pengguna..." />
```

### 7. Spinner

**ARIA Attributes:**

- `role="status"` - Indicates loading status
- `aria-label="Memuat..."` - Describes loading state (customizable)

**Usage:**

```jsx
<Spinner size="md" ariaLabel="Memuat data..." />
```

## Screen Reader Announcements

### AccessibilityAnnouncer Component

A global component that provides aria-live regions for screen reader announcements. It's automatically included in the root layout.

**Features:**

- Polite announcements for loading completions and general updates
- Assertive announcements for errors and critical updates
- Automatic cleanup after announcements

### announce() Function

A utility function to programmatically announce messages to screen readers.

**Usage:**

```javascript
import { announce } from "@/components/ui/accessibility-announcer";

// Polite announcement (for success messages)
announce("Data berhasil disimpan", "polite");

// Assertive announcement (for errors)
announce("Terjadi kesalahan saat menyimpan data", "assertive");
```

## useActionLoading Hook

The `useActionLoading` hook automatically announces loading states, completions, and errors to screen readers.

**Features:**

- Announces loading state when action starts (if `loadingAnnouncement` provided)
- Announces success with polite priority
- Announces errors with assertive priority

**Usage:**

```javascript
const { executeAction, isActionLoading } = useActionLoading();

await executeAction(
  `delete-${id}`,
  async () => {
    const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Gagal menghapus");
    return response.json();
  },
  {
    successMessage: "Item berhasil dihapus",
    errorMessage: "Gagal menghapus item",
    loadingAnnouncement: "Menghapus item...",
    onSuccess: () => fetchItems(),
  }
);
```

## Toast Notifications

Toast notifications (via Sonner) are automatically accessible:

- Error toasts are announced with assertive priority
- Success toasts are announced with polite priority
- All toasts include appropriate icons for visual users

## Testing with Screen Readers

### Recommended Screen Readers

- **Windows**: NVDA (free), JAWS (commercial)
- **macOS**: VoiceOver (built-in)
- **Linux**: Orca (free)

### Testing Checklist

1. **Loading States**
   - [ ] Screen reader announces when skeleton screens appear
   - [ ] Screen reader announces what content is loading
   - [ ] Loading indicators have proper role and aria-busy attributes

2. **Button Actions**
   - [ ] Screen reader announces when button becomes disabled
   - [ ] Loading text is announced when button is clicked
   - [ ] Button re-enables after action completes

3. **Completions**
   - [ ] Success messages are announced with polite priority
   - [ ] Completion announcements don't interrupt user

4. **Errors**
   - [ ] Error messages are announced with assertive priority
   - [ ] Error announcements interrupt current screen reader output
   - [ ] Error messages are clear and actionable

5. **Overlays**
   - [ ] Loading overlays announce their presence
   - [ ] Overlay messages are descriptive
   - [ ] Focus management is appropriate

## Best Practices

### 1. Always Provide Descriptive Labels

```jsx
// Good
<TableSkeleton aria-label="Memuat daftar transaksi..." />

// Bad
<TableSkeleton aria-label="Loading..." />
```

### 2. Use Appropriate Announcement Priority

```javascript
// Polite for non-critical updates
announce("Data berhasil disimpan", "polite");

// Assertive for errors and critical information
announce("Koneksi terputus", "assertive");
```

### 3. Maintain Loading State Consistency

```jsx
// Ensure loading states are cleared on both success and error
try {
  setIsLoading(true);
  await saveData();
} catch (error) {
  // Handle error
} finally {
  setIsLoading(false); // Always clear loading state
}
```

### 4. Provide Context in Announcements

```javascript
// Good - provides context
announce("Transaksi #1234 berhasil dihapus", "polite");

// Bad - lacks context
announce("Berhasil dihapus", "polite");
```

## Common Patterns

### Page Loading with Skeleton

```jsx
function MyPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData()
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <TableSkeleton rows={5} columns={6} />;
  }

  return <DataTable data={data} />;
}
```

### Form Submission with Loading Button

```jsx
function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await saveData(data);
      announce("Data berhasil disimpan", "polite");
    } catch (error) {
      announce("Gagal menyimpan data", "assertive");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <LoadingButton
        isLoading={isSubmitting}
        loadingText="Menyimpan..."
        type="submit"
      >
        Simpan
      </LoadingButton>
    </form>
  );
}
```

### Item-Specific Actions

```jsx
function ItemList() {
  const { executeAction, isActionLoading } = useActionLoading();

  const handleDelete = async (id) => {
    await executeAction(
      `delete-${id}`,
      async () => {
        await deleteItem(id);
      },
      {
        successMessage: "Item berhasil dihapus",
        errorMessage: "Gagal menghapus item",
        loadingAnnouncement: "Menghapus item...",
      }
    );
  };

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          <span>{item.name}</span>
          <LoadingButton
            isLoading={isActionLoading(`delete-${item.id}`)}
            onClick={() => handleDelete(item.id)}
          >
            Hapus
          </LoadingButton>
        </div>
      ))}
    </div>
  );
}
```

## Resources

- [ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- [ARIA: status role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role)
- [WebAIM: Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [W3C ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
