
'use client';

const PRESET_COLORS = ['#7C5C3E', '#C8883A', '#2D7A4F', '#2563EB', '#7C3AED', '#C0392B', '#0891B2', '#374151'];

interface CategoryFormProps {
  initialData?: { id: string; name: string; color: string } | null;
  onSubmit: (data: { id?: string; name: string; color: string }) => Promise<void>;
  onCancel?: () => void;
  loading: boolean;
}

export default function CategoryForm({ initialData, onSubmit, onCancel, loading }: CategoryFormProps) {
  // This component is now inlined in the page — kept for backward compatibility
  return null;
}
