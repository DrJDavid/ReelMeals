interface AlertProps {
  type: "error" | "success" | "warning" | "info";
  message: string;
}

export function Alert({ type, message }: AlertProps) {
  const styles = {
    error: "bg-red-500/10 border-red-500/50 text-red-400",
    success: "bg-green-500/10 border-green-500/50 text-green-400",
    warning: "bg-yellow-500/10 border-yellow-500/50 text-yellow-400",
    info: "bg-blue-500/10 border-blue-500/50 text-blue-400",
  };

  return (
    <div
      className={`p-3 rounded-lg border ${styles[type]} text-sm text-center`}
    >
      {message}
    </div>
  );
}
