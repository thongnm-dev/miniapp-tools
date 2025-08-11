import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";


interface PanelProps {
    children: React.ReactNode,
    className?: string,
    contentClassName?: string,
    title: string,
    renderHeader?: React.ReactNode,
    classNameHeader?: string
}

const Panel: React.FC<PanelProps> = ({ title, children, className, contentClassName, renderHeader, classNameHeader}) => {

    const [collapse, setCollapse] = useState<boolean>(false);

    const toggle = () => {
        setCollapse(!collapse);
    }

    return (
        <>
            <div className={`shadow rounded grid grid-cols-1 bg-white ${className}`}>
                <div className="border-b p-4 border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className='flex flex-row gap-4 bg-transparent flex-1' onClick={toggle}>
                            <button className="py-2.5" onClick={toggle}>
                                {collapse ? <MinusIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                            </button>
                            <span>{title}</span>
                        </div>
                        {renderHeader && <div className={`flex items-end space-x-2 ${classNameHeader}`}>
                            {renderHeader}
                        </div>}
                    </div>
                </div>

                <div className={`bg-white rounded-lg border ${contentClassName} ${collapse? 'hidden' : ''}`}>
                    {children}
                </div>
            </div>
        </>
    )
}

export default Panel;