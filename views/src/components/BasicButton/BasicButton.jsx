import Button from 'react-bootstrap/Button';
import './BasicButton.css';

export default function BasicButton({
  children,
  onClick = () => {},
  light = false,
  variant,    // optional override
  size = undefined,
  style,
  ...props
}) {

  const mappedVariant = variant ?? (light ? 'outline-primary' : 'primary');

  return (
    <Button
        onClick={onClick}
        variant={mappedVariant}
        size={size}
        className={'basic-button'}
        style={style}
        {...props}
    >
      {children}
    </Button>
  );
}