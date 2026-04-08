import React from 'react';
type Props = {
    children: React.ReactNode;
};
type State = {
    hasError: boolean;
    error: Error | null;
};
declare class ErrorBoundary extends React.Component<Props, State> {
    state: State;
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, info: React.ErrorInfo): void;
    handleRestart: () => void;
    render(): string | number | boolean | React.JSX.Element | Iterable<React.ReactNode> | null | undefined;
}
export default ErrorBoundary;
//# sourceMappingURL=ErrorBoundary.d.ts.map