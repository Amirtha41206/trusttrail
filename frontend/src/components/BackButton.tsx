import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function BackButton({ label }: { label?: string }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
      <ChevronLeft className="w-5 h-5" />
      {label && <span className="text-sm font-body">{label}</span>}
    </button>
  );
}
