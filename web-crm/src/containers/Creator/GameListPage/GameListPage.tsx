import React, { FC } from "react";
import styles from "./GameListPage.module.scss";
import Table from "src/components/Table";

export interface IGameItem {
    id: number;
    title: string;
    location: string;
    created_at: string;
    updated_at: string;
    count_quests: number;
};

/**
 * Список созданных игр
 * @returns 
 */
const GameListPage: FC<any> = () => {

    const renderGameItem = (item: IGameItem) => {
        return (
            <div className={styles.rowItem}>
                <div className={styles.rowCell}>
                    <p title={item.title}>{item.title}</p>
                </div>
                <div className={styles.rowCell}>
                    <p title={item.location}>{item.location}</p>
                </div>
                <div className={styles.rowCell}>
                    <p title={item.created_at}>{item.created_at}</p>
                </div>
                <div className={styles.rowCell}>
                    <p title={item.updated_at}>{item.updated_at}</p>
                </div>
                <div className={styles.rowCell}>
                    <p title={`${item.count_quests}`}>{item.count_quests}</p>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className={styles.container}>
                <h2>Список созданных игр</h2>
                <Table
                    columns={["Название", "Локация", "Дата создания", "Дата изменения", "Кол-во квестов"]}
                    data={[
                        {
                            id: 1,
                            title: "Hello",
                            location: "Иркутск Иркутск Иркутск Иркутск",
                            created_at: "11.02.2001",
                            updated_at: '22.02.2004',
                            count_quests: 25
                        },
                        {
                            id: 2,
                            title: "Hello",
                            location: "Иркутск",
                            created_at: "11.02.2001",
                            updated_at: '22.02.2004 Иркутск Иркутск Иркутск',
                            count_quests: 25
                        },
                        {
                            id: 3,
                            title: "Hello",
                            location: "Иркутск",
                            created_at: "11.02.2001",
                            updated_at: '22.02.2004',
                            count_quests: 25
                        },
                        {
                            id: 4,
                            title: "Hello",
                            location: "Иркутск",
                            created_at: "11.02.2001",
                            updated_at: '22.02.2004 22.02.200422.02.200422.02.200202.200422.02.200422.02.2.02.2004',
                            count_quests: 25
                        },
                        {
                            id: 5,
                            title: "Hello",
                            location: "Иркутск",
                            created_at: "11.02.2001",
                            updated_at: '22.02.2004',
                            count_quests: 25
                        },
                        {
                            id: 6,
                            title: "Hello",
                            location: "Иркутск",
                            created_at: "11.02.2001",
                            updated_at: '22.02.2004',
                            count_quests: 25
                        },
                        {
                            id: 7,
                            title: "Hello",
                            location: "Иркутск",
                            created_at: "11.02.2001",
                            updated_at: '22.02.2004',
                            count_quests: 25
                        },
                        {
                            id: 8,
                            title: "Hello",
                            location: "Иркутск",
                            created_at: "11.02.2001",
                            updated_at: '22.02.2004',
                            count_quests: 25
                        },
                        {
                            id: 9,
                            title: "Hello",
                            location: "Иркутск",
                            created_at: "11.02.2001",
                            updated_at: '22.02.2004',
                            count_quests: 25
                        },
                        {
                            id: 10,
                            title: "Hello",
                            location: "Иркутск Иркутск Иркутск Иркутск",
                            created_at: "11.02.2001",
                            updated_at: '22.02.2004',
                            count_quests: 25
                        },
                    ]}
                    renderItem={renderGameItem}
                />
            </div>
        </>
    )
};

export default GameListPage;