export type TreeItem ={

    title: string;
    description?: string;
    children?: TreeItem[];
    type?: string; 

}

export type TreeViewProps = {
    treeData: TreeItem[];
}

import Item from './item';

const TreeView = ( { treeData } : TreeViewProps ) => {

    return <>
        <div className="bg-surface rounded-lg">
            {treeData.map( (item, index) => (
                <Item key={index} data={item} />
            ))}
        </div>
    </>

};

export default TreeView;