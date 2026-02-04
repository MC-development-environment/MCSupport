import * as React from "react";
import { cn } from "@/common/utils/utils";

interface SliderProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "max" | "step"
> {
  value: number[];
  onValueChange: (value: number[]) => void;
  max: number;
  step: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, max, step, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange([parseFloat(e.target.value)]);
    };

    return (
      <div className={cn("relative w-full flex items-center", className)}>
        <input
          type="range"
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          min={0}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
