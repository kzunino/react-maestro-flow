import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "default" | "secondary";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ variant = "default", className = "", ...props }, ref) => {
		const baseClasses =
			"px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
		const variantClasses =
			variant === "secondary"
				? "bg-gray-200 text-gray-900 hover:bg-gray-300"
				: "bg-blue-600 text-white hover:bg-blue-700";

		return (
			<button
				ref={ref}
				className={`${baseClasses} ${variantClasses} ${className}`}
				{...props}
			/>
		);
	},
);

Button.displayName = "Button";
