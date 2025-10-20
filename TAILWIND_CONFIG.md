# Cấu hình Tailwind CSS cho Restaurant Admin

## 📦 Dependencies đã cài đặt

- **tailwindcss**: ^3.4.0
- **postcss**: latest
- **autoprefixer**: latest

## 🎨 Custom Theme

### Colors
- Sử dụng CSS variables cho `background` và `foreground`
- Primary color palette (blue) từ 50-900

### Fonts
- Sans: Geist Sans (từ Google Fonts)
- Mono: Geist Mono

### Animations
- `spin-slow`: Quay chậm (3s)
- `pulse-slow`: Pulse chậm (3s)

## 🛠️ Custom Components (trong globals.css)

### Buttons
```tsx
.btn-primary   // Blue background, white text
.btn-secondary // Gray background, dark text
.btn-danger    // Red background, white text
```

### Other Components
```tsx
.card        // White background, shadow, padding
.input-field // Styled input field
.label       // Form label styling
```

## 📝 Usage Examples

### Button
```tsx
<button className="btn-primary">
  Click me
</button>

// Or inline
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
  Click me
</button>
```

### Card
```tsx
<div className="card">
  <h2 className="text-xl font-bold mb-4">Title</h2>
  <p>Content here</p>
</div>
```

### Form Input
```tsx
<div>
  <label className="label">Email</label>
  <input type="email" className="input-field" />
</div>
```

## 🚀 Development

```bash
npm run dev
```

Tailwind sẽ tự động compile các class được sử dụng trong code.

## 📱 Responsive Design

Sử dụng breakpoints mặc định của Tailwind:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

Example:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Content */}
</div>
```

## 🌙 Dark Mode

Dark mode được cấu hình với `media` query (tự động theo system preference).

Để sử dụng class-based dark mode:
1. Thay đổi `darkMode: 'class'` trong `tailwind.config.js`
2. Toggle class `dark` trên HTML element

```tsx
<div className="bg-white dark:bg-gray-900">
  {/* Content */}
</div>
```
