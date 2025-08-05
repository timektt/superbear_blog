import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveValue(value: string | number): R;
      toBeDisabled(): R;
      toBeChecked(): R;
      toHaveFocus(): R;
      toBeVisible(): R;
      toBeEmptyDOMElement(): R;
      toHaveClass(...classNames: string[]): R;
      toHaveStyle(css: string | Record<string, any>): R;
    }
  }
}