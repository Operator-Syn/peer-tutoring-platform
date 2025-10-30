import Button from 'react-bootstrap/Button';
import './BasicButton.css';

export default function BasicButton({
  children,
  onClick = () => {},
  light = false,
  variant,    // optional override
  size = undefined,
  ...props
}) {

  const mappedVariant = variant ?? (light ? 'outline-primary' : 'primary');

  return (
    <Button
        onClick={onClick}
        variant={mappedVariant}
        size={size}
        className={'basic-button'}
        {...props}
    >
      {children}
    </Button>
  );
}