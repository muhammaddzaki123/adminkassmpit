# 🎨 T-SMART Design System

Design system untuk aplikasi **Treasury Smart System (T-SMART)** - Sistem Manajemen Keuangan Sekolah Digital.

## 🌈 Color Palette

### Primary Colors
```css
Primary Green: #7EC242
- primary-50: #F0F8E8
- primary-100: #E1F1D1
- primary-200: #CDE28C (Secondary Light Green)
- primary-500: #7EC242 (Primary)
- primary-700: #4C7924 (Deep Green)
```

### Accent Colors
```css
Accent Orange: #F29A2E
- accent-50: #FEF5E8
- accent-500: #F29A2E
- accent-600: #D8841A
```

### Neutral Colors
```css
Text: #1C1C1C
Background: #FFFFFF
Soft Gray: #F5F6F7
```

## 🎯 Design Philosophy

### Style Characteristics
- ✅ Modern & clean interface
- ✅ Islamic-friendly theme (simple geometric shapes)
- ✅ Rounded UI components (rounded-xl, rounded-2xl)
- ✅ Light neumorphism shadows
- ✅ Aesthetic similar to Apple Finance App + SIPP School Dashboard

### Typography
- **Primary Font**: Inter (sans-serif)
- **Secondary Font**: Poppins (headings)
- **Weights**: 300, 400, 500, 600, 700, 800

### Icons
- **Library**: Lucide React
- **Style**: Material Icons Rounded (minimal style)

## 📦 Components

### Buttons
```tsx
<Button variant="primary" size="md">Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="accent">Accent Button</Button>
<Button variant="danger">Danger Button</Button>
```

**Variants**:
- `primary` - Green background (#7EC242)
- `secondary` - White with border
- `outline` - Transparent with green border
- `ghost` - Transparent hover effect
- `accent` - Orange background (#F29A2E)
- `danger` - Red background

**Sizes**: `sm`, `md`, `lg`

**Features**:
- ✅ Shimmer effect on hover (`btn-shimmer`)
- ✅ Active scale animation (`active:scale-95`)
- ✅ Loading state with spinner
- ✅ Icon support

### Cards
```tsx
<Card padding="md">
  Content here
</Card>

<StatCard
  title="Total Pemasukan"
  value="Rp 150 Juta"
  icon={<CreditCard />}
  trend="12% dari bulan lalu"
  trendUp={true}
  color="primary"
/>
```

**Features**:
- ✅ Rounded corners (rounded-2xl)
- ✅ Soft shadows with hover effect
- ✅ Card hover animation (`card-hover`)
- ✅ Padding variants: `none`, `sm`, `md`, `lg`

### Inputs
```tsx
<Input
  label="Username"
  type="text"
  placeholder="Enter username"
  icon={<User />}
  error="Error message"
/>
```

**Features**:
- ✅ Border-2 with primary focus ring
- ✅ Icon support (left side)
- ✅ Error state styling
- ✅ Hover shadow effects
- ✅ Label with semibold font

### Badges
```tsx
<Badge variant="success">Paid</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Unpaid</Badge>
<Badge variant="primary">Active</Badge>
<Badge variant="accent">Highlight</Badge>
```

**Variants**:
- `success` / `primary` - Green
- `warning` - Yellow
- `error` - Red
- `info` - Blue
- `default` - Gray
- `accent` - Orange

### Toast Notifications
```tsx
<Toast
  type="success"
  message="Success!"
  description="Operation completed successfully"
  onClose={() => {}}
/>
```

**Types**: `success`, `error`, `warning`, `info`

## 🖼️ Layout Components

### Sidebar
- **Width**: 64 (256px)
- **Background**: White with shadow
- **Logo**: Gradient green rounded-xl
- **Navigation**: Rounded-xl items with active gradient
- **Active State**: Green gradient with pulse indicator

### Header
- **Background**: White with border & shadow
- **Sticky**: top-0 z-30
- **Features**:
  - Mobile menu toggle
  - Notification bell with badge
  - User profile with avatar

## 🎬 Animations

### CSS Animations
```css
.animate-fade-in - Fade in effect (0.3s)
.animate-slide-up - Slide up from bottom (0.3s)
.animate-slide-down - Slide down from top (0.3s)
```

### Hover Effects
```css
.card-hover - Card lift on hover
.btn-shimmer - Shimmer effect on buttons
```

## 🎨 Shadows

```css
shadow-soft - Light shadow: 0 2px 8px rgba(0, 0, 0, 0.06)
shadow-medium - Medium shadow: 0 4px 12px rgba(0, 0, 0, 0.08)
shadow-neumorphism - 3D neumorphism effect
```

## 📱 Pages Structure

### 1. Login Page (`/login`)
- Role selection cards (Treasurer, Headmaster, Admin, Parent)
- Animated login form
- Gradient background with decorative elements

### 2. Dashboard (`/` or `/dashboard`)
- 4 stat cards with icons
- Charts and graphs
- Quick action buttons
- Recent transactions table

### 3. Data Siswa (`/students`)
- Student list table with filters
- Add/Import student buttons
- Search & filter by class/status

### 4. Pembayaran SPP (`/spp`)
- Payment table with status badges
- Upload proof of transfer
- Filter by class/month/status

### 5. Pengeluaran (`/expenses`)
- Expense list with categories
- Add expense form
- Upload receipt

### 6. Laporan (`/reports`)
- Export buttons (PDF, Excel, Print)
- Multiple report types
- Charts and visualizations

### 7. WA Reminder (`/wa-reminder`)
- Template editor
- Preview message bubble
- Toggle automation

### 8. Backup (`/backup`)
- Export database
- Import database
- Scheduled backups

## 📐 Grid System

```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Cards */}
</div>
```

## 🎯 Best Practices

### 1. Spacing
- Use consistent spacing: `gap-4`, `gap-6`, `gap-8`
- Padding: `p-4`, `p-6`, `p-8`
- Margin: `mb-4`, `mt-6`, etc.

### 2. Typography
- Headings: `text-2xl`, `text-3xl` with `font-bold`
- Body text: `text-sm`, `text-base` with `font-medium`
- Subtle text: `text-xs` with `text-neutral-600`

### 3. Colors
- Always use Tailwind color classes: `bg-primary`, `text-primary-700`
- Avoid hardcoded hex colors
- Use semantic naming: `bg-primary` instead of `bg-green-500`

### 4. Accessibility
- Always include `aria-label` for icon buttons
- Use semantic HTML elements
- Maintain good color contrast

### 5. Responsive Design
- Mobile first approach
- Use `hidden lg:block` for desktop-only elements
- Test on multiple screen sizes

## 🚀 Usage Example

```tsx
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

function MyPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-neutral-900">
        My Page
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value="1,234"
          icon={<Users className="w-6 h-6" />}
          color="primary"
        />
      </div>

      <Card padding="md">
        <h2 className="text-xl font-bold mb-4">Form</h2>
        <Input label="Name" placeholder="Enter name" />
        <Button variant="primary" className="mt-4">
          Submit
        </Button>
      </Card>
    </div>
  );
}
```

## 📝 Notes

- All components support className prop for custom styling
- Use `cn()` utility for conditional classes
- Tailwind CSS v4 with custom config
- All colors are defined in `tailwind.config.ts`

---

**Design by T-SMART Team** ✨
