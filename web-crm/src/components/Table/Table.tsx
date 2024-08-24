import React, { FC } from "react";
import styles from './Table.module.scss';

export interface ITableProps {
    columns: string[];
    data: any[];
    renderItem: (item: any) => JSX.Element;
};

/**
 * Функциональный компонент таблицы
 * @returns 
 */
const Table: FC<ITableProps> = (props) => {

    return (
        <>
            <div className={styles.container}>
                <div className={styles.column}>
                    {
                        props.columns.map((item, key) => {
                            return (
                                <div key={key} className={styles.columnCell}>
                                    <p>{item}</p>
                                </div>
                            );
                        })
                    }
                </div>
                <div className={styles.body}>
                    {
                        props.data.map((item, key) => {
                            return (
                                <React.Fragment key={key}>
                                    {
                                        props.renderItem(item)
                                    }
                                </React.Fragment>
                            );
                        })
                    }
                </div>
            </div>
        </>
    )
};


export default Table;