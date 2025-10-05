import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import "../../styles/button.css";

const Button = React.forwardRef(
    ({ variant = "default", size = "default", asChild = false, className = '', ...props}, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
               ref={ref}
               className={`btn btn-${variant} btn-${size} ${className}`}
               {...props}
            />
        );
    }
);

export { Button };