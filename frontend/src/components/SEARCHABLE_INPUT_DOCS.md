# SearchableInput Component Documentation

## Overview

The `SearchableInput` component replaces static checkbox lists with a dynamic, searchable interface for selecting items like symptoms, allergies, and health conditions.

## Features

✅ **Search Filtering** - Type to filter items starting with that letter
✅ **Real-time Suggestions** - Dropdown shows matching items as you type
✅ **Chip Display** - Selected items show as removable chips
✅ **Keyboard Support** - Enter to add, Backspace to remove, Escape to close
✅ **Responsive** - Works on all screen sizes
✅ **Accessible** - Proper ARIA labels and keyboard navigation

## Usage

### Basic Implementation

```jsx
import SearchableInput from './SearchableInput';

const MyComponent = () => {
  const ITEMS = ['item1', 'item2', 'item3'];
  const [selected, setSelected] = useState([]);

  return (
    <SearchableInput
      items={ITEMS}
      selectedItems={selected}
      onSelectionChange={setSelected}
      placeholder="Search items..."
      label="Select Items"
    />
  );
};
```

### In SymptomChecker Example

```jsx
import SearchableInput from './SearchableInput';

const COMMON_SYMPTOMS = [
  'fever', 'headache', 'cough', 'sore throat', 'fatigue', 'nausea'
];

// In component:
<SearchableInput
  items={COMMON_SYMPTOMS}
  selectedItems={symptoms}
  onSelectionChange={setSymptoms}
  placeholder="Type a symptom (e.g., fever, headache)..."
  label="Select symptoms"
  maxDisplay={8}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `string[]` | `[]` | List of available items to select from |
| `selectedItems` | `string[]` | `[]` | Currently selected items |
| `onSelectionChange` | `function` | `() => {}` | Callback when selection changes |
| `placeholder` | `string` | `"Search..."` | Input placeholder text |
| `label` | `string` | `""` | Label displayed above input |
| `maxDisplay` | `number` | `8` | Max items shown in dropdown |

## How It Works

### Search Algorithm
- **Case-insensitive prefix matching**
- Items must start with the typed characters
- Example: typing "h" shows "headache", "heart disease", "hives"

### User Interactions

#### Adding Items
1. Type in the search box
2. Matching items appear in dropdown
3. Click item or press Enter to add
4. Selected item appears as a chip
5. Search box clears for next selection

#### Removing Items
1. Click the × button on a chip
2. Or place cursor at end of search and press Backspace

#### Keyboard Navigation
- **Enter** - Add first matching item
- **Escape** - Close dropdown
- **Backspace** (empty search) - Remove last selected item
- **Arrow keys** - Future enhancement for navigation

### Dropdown Behavior
- Opens automatically when typing
- Shows up to `maxDisplay` items
- Shows "+N more items" if more exist
- Closes when item selected or when clicking outside
- Displays "No matches found" message if nothing matches

## Styling

The component uses Tailwind CSS classes for styling:

### Key Classes
- Input container: `flex flex-wrap items-center gap-2 p-3 border border-gray-300 rounded-lg`
- Selected chip: `inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full`
- Dropdown: `absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg`
- Hover state: `hover:bg-blue-50 transition`

### Customization

To change colors, modify the Tailwind classes in `SearchableInput.jsx`:

```jsx
// Change chip color from blue to green
bg-blue-100 → bg-green-100
text-blue-800 → text-green-800
bg-blue-50 → bg-green-50
```

## Examples

### Example 1: Simple Symptoms Selection
```jsx
<SearchableInput
  items={['fever', 'cough', 'headache']}
  selectedItems={symptoms}
  onSelectionChange={setSymptoms}
  placeholder="Search symptoms..."
/>
```

### Example 2: With All Options
```jsx
<SearchableInput
  items={ALLERGIES_LIST}
  selectedItems={allergies}
  onSelectionChange={setAllergies}
  placeholder="Type allergy name..."
  label="Known Allergies"
  maxDisplay={10}
/>
```

### Example 3: Health Conditions with Help
```jsx
<div>
  <h3>Existing Conditions</h3>
  <SearchableInput
    items={CONDITIONS_LIST}
    selectedItems={conditions}
    onSelectionChange={setConditions}
    placeholder="Search conditions (e.g., diabetes, asthma)..."
    label="Select your conditions"
    maxDisplay={8}
  />
  <p className="text-sm text-gray-600 mt-2">
    💡 Tip: Type first letter to quickly find items
  </p>
</div>
```

## Benefits Over Checkboxes

| Aspect | Checkboxes | SearchableInput |
|--------|-----------|-----------------|
| **UI Space** | Uses large grid | Compact, scalable |
| **Scalability** | Hard with 50+ items | Easy with 100+ items |
| **Speed** | Scroll to find | Type to filter |
| **Mobile** | Difficult to navigate | Touch-friendly |
| **Accessibility** | Good | Better with keyboard support |
| **Visual Clutter** | High with many items | Low, clean interface |

## Accessibility Features

✅ **Keyboard Support**
- Tab to navigate
- Enter to select
- Escape to close
- Backspace to remove

✅ **Screen Readers**
- Proper labels and descriptions
- ARIA attributes on interactive elements
- Clear feedback messages

✅ **Visual Feedback**
- Hover states on dropdown items
- Highlighting on keyboard focus
- Clear visual separation of selected items

## Common Issues & Solutions

### Issue: Item doesn't appear in search
**Solution:** Check if item starts with typed character (case-insensitive)
- Search for "f" shows "fever" but not "body fatigue"

### Issue: Dropdown doesn't appear
**Solution:** Make sure `items` prop is populated and not empty
```jsx
// ❌ Wrong
<SearchableInput items={null} ... />

// ✅ Correct
<SearchableInput items={SYMPTOMS_LIST} ... />
```

### Issue: Selected items not updating
**Solution:** Ensure `onSelectionChange` callback updates state
```jsx
// ✅ Correct pattern
const [selected, setSelected] = useState([]);
<SearchableInput 
  onSelectionChange={setSelected}  // Direct state setter
  selectedItems={selected}
/>
```

### Issue: Styling doesn't match theme
**Solution:** Customize Tailwind classes in component
- Change `bg-blue-100` to your brand color
- Modify padding/gap values for different sizes

## Performance Notes

- ✅ Handles 100+ items smoothly
- ✅ Debounced search filtering
- ✅ Efficient dropdown rendering
- ✅ Minimal re-renders with React.memo (can be added)

## Future Enhancements

Potential improvements for future versions:

1. **Categories** - Group items by category (e.g., Antibiotics, Pain relievers)
2. **Multi-language** - Support for translations
3. **Custom Rendering** - Allow custom item templates
4. **Async Loading** - Load items from API
5. **Advanced Filtering** - Support wildcards, AND/OR logic
6. **Search History** - Remember previous selections

## Component Location

```
frontend/src/components/SearchableInput.jsx
```

## Import Statement

```jsx
import SearchableInput from './SearchableInput';
```

## Related Components

- `SymptomChecker.jsx` - Uses SearchableInput for symptoms, allergies, conditions
- `ChatWidget.jsx` - Medical Q&A chatbot
- `PrescriptionHandling.jsx` - Prescription management

---

**Version:** 1.0
**Last Updated:** 2026-01-26
**Compatibility:** React 16.8+, Tailwind CSS 3.0+
