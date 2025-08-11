import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface FieldsetProps {
    children: React.ReactNode,
    className?: string,
    contentClassName?: string,
    title: string
}

const Fieldset: React.FC<FieldsetProps> = ({ children, title, className, contentClassName }) => {
    const [collapse, setCollapse] = useState<boolean>(false);

    const toggle = () => {
        setCollapse(!collapse);
    }
    return (
        <>
            <fieldset className={`border border-gray-300 rounded-lg p-4 bg-white shadow-lg ${className}`}>
                <legend className="text-base rounded-lg border border-gray-300 bg-white">
                    <div className="px-1">
                        <button className="flex flex-row items-center justify-between gap-2 px-2 py-2" onClick={toggle}>
                            {collapse ? <MinusIcon className="h-3 w-3" /> : <PlusIcon className="h-3 w-3" />}
                            <span>{title}</span>
                        </button>
                    </div>
                </legend>
                <div className={`bg-white rounded-lg ${contentClassName} ${collapse? 'hidden' : ''}`}>
                    {children}
                </div>
            </fieldset>
        </>
    )
}

export default Fieldset;