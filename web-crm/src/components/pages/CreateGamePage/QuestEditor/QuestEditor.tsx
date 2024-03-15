import { FC, Fragment, useEffect, useState } from "react";
import Map, { Marker, Source, Layer } from 'react-map-gl';
import styles from "./QuestEditor.module.scss";
import ConfigApp from "src/config/config.app";
import { useAppDispatch, useAppSelector } from "src/hooks/redux.hook";
import MarkAction from "src/store/actions/Map/MarkAction";
import messageQueueAction from "src/store/actions/MessageQueueAction";
import { IMarkModel } from "src/models/IMarkModel";
import { IQuestDataModel, IQuestModel } from "src/models/IQuestModel";
import Loader from "src/components/UI/Loader";

const scaleFactor = 0.5;

const QuestEditor: FC<any> = () => {
    const markSelector = useAppSelector((s) => s.markReducer);
    const dispatch = useAppDispatch();

    const [selectMark, setSelectMark] = useState<IMarkModel>({
        location: "Выберите метку на карте",
    });

    const [dataQuest, setDataQuest] = useState<IQuestDataModel>({
        task: "",
        action: "",
        radius: 1,
        hint: ""
    });
    const [listQuests, setListQuests] = useState<IQuestModel[]>([]);

    /**
     * Поиск квеста по заданным координатам (lat; lng)
     * @param lat Координата lat
     * @param lng Координата lng
     * @returns 
     */
    const findQuestByLatLng = (lat, lng) => {
        let index = -1;
        for (let i = 0; i < listQuests.length; i++) {
            if (listQuests[i].lat == lat && listQuests[i].lng == lng) {
                index = i;
                break;
            }
        }

        return index;
    };

    //идентификация маркера, на который было произведено нажатие (клик)
    const getMarkerState = (dataMarks, obj) => {
        if (!dataMarks || !obj) {
            return null;
        }

        for (let i = 0; i < dataMarks.length; i++) {
            if (dataMarks[i].lat == obj.lat && dataMarks[i].lng == obj.lng) {
                return dataMarks[i];
            }
        }

        return null;
    };

    const clickMarkerHandler = (e) => {
        // resetQuestBlock();

        /*await setBlockEditQuest({
            display: "none",
        });*/

        // Открытие блока для добавления квеста
        /*await setBlockQuest({
            display: "grid",
        });*/

        let marker = getMarkerState(markSelector.freeMarks, {
            lat: parseFloat(e.target._lngLat.lat),
            lng: parseFloat(e.target._lngLat.lng),
        });

        if (!marker) {
            return;
        }

        let index = findQuestByLatLng(marker.lat, marker.lng);
        if (index >= 0) {
            setDataQuest({
                task: listQuests[index].task,
                action: listQuests[index].action,
                radius: listQuests[index].radius,
                hint: listQuests[index].hint,
            });

            /*setBlockEditQuest({
                display: "grid",
            });*/
        }

        setSelectMark({
            location: marker.location,
            lng: marker.lng,
            lat: marker.lat,
            id: marker.id,
        });

        dispatch(messageQueueAction.addMessage(null, "success", "Метка выбрана"));
    };

    return (
        <>
            <div className={styles.container}>
                <div className={styles.map}>
                    <Map
                        initialViewState={{
                            longitude: 104.298234,
                            latitude: 52.262757,
                            zoom: 14
                        }}
                        mapStyle="mapbox://styles/mapbox/streets-v11"
                        mapboxAccessToken={ConfigApp.MAPBOX_ACCESS_TOKEN}
                        onLoad={() => {
                            dispatch(MarkAction.getFreeMarks(() => {
                                dispatch(messageQueueAction.addMessage(null, "success", "Свободные метки загружены!"));
                            }))
                        }}
                        onDblClick={(e) => {
                            //resetQuestBlock();
                        }}
                    >
                        {
                            markSelector.freeMarks.map((value, index) => {
                                return (
                                    <>
                                        <Fragment
                                            key={value.id}
                                        >
                                            <Marker
                                                longitude={Number(value.lng)}
                                                latitude={Number(value.lat)}
                                                color="#FF0000"
                                                onClick={clickMarkerHandler}
                                            >
                                            </Marker>
                                            <Source
                                                id={String(value.id)}
                                                type="geojson" data={
                                                    {
                                                        type: 'FeatureCollection',
                                                        features: [
                                                            {
                                                                type: 'Feature',
                                                                geometry: {
                                                                    type: 'Point',
                                                                    coordinates: [Number(value.lng), Number(value.lat)]
                                                                },
                                                                properties: null
                                                            }
                                                        ]
                                                    }
                                                }
                                            >
                                                <Layer
                                                    {
                                                    ...{
                                                        key: (String(value.id) + "-layer"),
                                                        id: String(value.id),
                                                        type: 'circle',
                                                        paint: {
                                                            'circle-radius': (((value.lat === selectMark.lat) &&
                                                                (value.lng === selectMark.lng))
                                                                ? 0
                                                                : 50) * scaleFactor,
                                                            'circle-color': findQuestByLatLng(value.lat, value.lng) >= 0
                                                                ? "#00FF00"
                                                                : "#0000FF",
                                                            'circle-stroke-width': 1,
                                                            'circle-stroke-color': findQuestByLatLng(value.lat, value.lng) >= 0
                                                                ? "#000000"
                                                                : "#FFFFFF",
                                                            'circle-opacity': 0.5
                                                        }
                                                    }
                                                    } />
                                            </Source>
                                        </Fragment>
                                    </>
                                );
                            })
                        }

                        {
                            selectMark.lat !== 0 && selectMark.lng !== 0 && (
                                <Source
                                    key={String(selectMark.id) + "-source"}
                                    id={String(selectMark.id)}
                                    type="geojson"
                                    data={
                                        {
                                            type: 'FeatureCollection',
                                            features: [
                                                {
                                                    type: 'Feature',
                                                    geometry: {
                                                        type: 'Point',
                                                        coordinates: [Number(selectMark.lng), Number(selectMark.lat)]
                                                    },
                                                    properties: null
                                                }
                                            ]
                                        }
                                    }
                                >
                                    <Layer {
                                        ...{
                                            id: String(selectMark.lat) + "-current",
                                            type: 'circle',
                                            paint: {
                                                'circle-radius': 50 * scaleFactor,
                                                'circle-color': "#000000",
                                                'circle-stroke-width': 1,
                                                'circle-stroke-color': "#FF0000",
                                                'circle-opacity': 0.5
                                            }
                                        }
                                    } />
                                </Source>
                            )}

                        {
                            selectMark.lat !== 0 &&
                            selectMark.lng !== 0 &&
                            dataQuest && (
                                <Source
                                    key={String(selectMark.id) + "-source"}
                                    id={String(selectMark.id)}
                                    type="geojson"
                                    data={
                                        {
                                            type: 'FeatureCollection',
                                            features: [
                                                {
                                                    type: 'Feature',
                                                    geometry: {
                                                        type: 'Point',
                                                        coordinates: [Number(selectMark.lng), Number(selectMark.lat)]
                                                    },
                                                    properties: null
                                                }
                                            ]
                                        }
                                    }
                                >
                                    <Layer {
                                        ...{
                                            id: selectMark.lat + "-dcm",
                                            type: 'circle',
                                            paint: {
                                                'circle-radius': dataQuest.radius * scaleFactor,
                                                'circle-color': "#00FF00",
                                                'circle-stroke-width': 1,
                                                'circle-stroke-color': "#00FF00",
                                                'circle-opacity': 0.5
                                            }
                                        }
                                    } />
                                </Source>
                            )}
                    </Map>
                </div>
            </div>

            {
                markSelector.isLoading && <Loader />
            }
        </>
    );
};

export default QuestEditor;
