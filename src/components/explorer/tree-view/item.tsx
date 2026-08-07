import {useState} from "react";
import type {TreeItem} from './tree-view';
import {Icon} from "@iconify/react";

export interface TreeViewItemProps{
    data: TreeItem;
}

const IconMapper = {
    'project': 'mdi:folder',
    'file': 'mdi:file',
};

const Item = ( { data } : TreeViewItemProps ) => {

    const [isOpen, setIsOpen] = useState(false);

    return <>
        <div className={`${isOpen ? 'bg-bg' : ''} hover:bg-bg p-1 rounded-lg flex flex-row gap-2 items-center relative group`} onClick={() => setIsOpen(!isOpen)}>
            <span>
                <span className={`h-full absolute top-0 left-[calc(0.8rem)] border-border border-1 w-0px ${isOpen ? '' : ''}`}></span>
                <Icon className={`w-5 h-5 z-2 relative ${data.children && data.children.length > 0 ? '' : 'invisible'} ${isOpen ? 'bg-bg' : 'bg-surface'} group-hover:bg-bg`} icon={isOpen ? "mdi:chevron-down" : "mdi:chevron-right"}/>
            </span>
            
            <Icon className="w-6 h-6 p-1 border-border border-2 rounded" icon={IconMapper[data.type] ?? data.type}/>
            <div className="flex flex-col">
                <h3 className="font-bold text-sm">{data.title}</h3>
                <p className="text-xs text-text-muted pl-1">{data.description}</p>
            </div>
        </div>
        {isOpen && data.children && data.children.length > 0 && (
            <div className="pl-4">
                {data.children.map((child, index) => (
                    <Item key={index} data={child} />
                ))}
            </div>
        )}
    </>;

};

export default Item;