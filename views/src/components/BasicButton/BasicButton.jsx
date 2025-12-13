import Button from 'react-bootstrap/Button';
import './BasicButton.css';

export default function BasicButton({
  children,
  onClick = () => {},
  light = false,
  variant,    // optional override
  danger,
  size = undefined,
  style,
  ...props
}) {

  let mappedVariant = variant ?? (light ? 'outline-primary' : 'primary');
  if (danger) {
    mappedVariant = light ? 'outline-danger' : 'danger';
  }

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