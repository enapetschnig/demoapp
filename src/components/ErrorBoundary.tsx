import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props { children: ReactNode }
interface State { hasError: boolean; message?: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("UI-Fehler abgefangen:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <div>
            <h2 className="text-lg font-medium">Es ist ein Fehler aufgetreten</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">{this.state.message}</p>
          </div>
          <Button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}>
            Seite neu laden
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
