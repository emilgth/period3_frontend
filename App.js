import React, {useState, useEffect, useRef} from 'react';
import {Platform, Modal, Text, TextInput, View, StyleSheet, TouchableHighlight, Alert} from 'react-native';
import * as Location from 'expo-location';
import MapView, {PROVIDER_GOOGLE} from 'react-native-maps';
import Constants from 'expo-constants';
import facade from "./serverFacade";
// import TextInput from "react-native-web/dist/exports/TextInput";


const MyButton = ({txt, onPressButton}) => {
	return (
		<TouchableHighlight style={styles.touchable} onPress={onPressButton}>
			<Text style={styles.touchableTxt}>{txt}</Text>
		</TouchableHighlight>
	);
}

export default App = () => {

	//HOOKS
	const [position, setPosition] = useState({latitude: Number, longitude: Number})
	const [errorMessage, setErrorMessage] = useState(null);
	const [gameArea, setGameArea] = useState([]);
	const [region, setRegion] = useState(null);
	const [serverIsUp, setServerIsUp] = useState(false);
	const [status, setStatus] = useState("");
	const [loggedIn, setLoggedIn] = useState(false);
	const [userInfo, setUserInfo] = useState({userName: 't1', password: 'secret'});
	const [modalVisible, setModalVisible] = useState(false);
	const [otherTeams, setOtherTeams] = useState([]);
	let mapRef = useRef(null);

	useEffect(() => {
		getLocationAsync();
	}, [])

	// useEffect(() => {
	// 	getGameArea();
	// }, []);


	// async function getGameArea() {
	// 	//Fetch gameArea via the facade, and call this method from within (top) useEffect
	// 	try {
	// 		const area = await facade.fetchGameArea();
	// 		setGameArea(area)
	// 		setServerIsUp(true)
	// 	} catch (err) {
	// 		setErrorMessage("Could not fetch GameArea")
	// 	}
	// }

	const getLocationAsync = async () => {
		//Request permission for users location, get the location and call this method from useEffect
		let {status} = await Location.requestPermissionsAsync();
		if (status !== 'granted') {
			setErrorMessage('Permission to access location was denied');
			return
		}

		let location = await Location.getCurrentPositionAsync({enableHighAccuracy: true});
		setPosition({latitude: location.coords.latitude, longitude: location.coords.longitude});
		setRegion({
			latitude: location.coords.latitude,
			longitude: location.coords.longitude,
			latitudeDelta: 0.0922,
			longitudeDelta: 0.0421
		});
	};

	/*
	When a press is done on the map, coordinates (lat,lon) are provided via the event object
	*/
	// const onMapPress = async (event) => {
	// 	//Get location from where user pressed on map, and check it against the server
	// 	const coordinate = event.nativeEvent.coordinate;
	// 	const lon = coordinate.longitude
	// 	const lat = coordinate.latitude
	// 	try {
	// 		const status = await facade.isUserInArea(lon, lat);
	// 		showStatusFromServer(setStatus, status);
	// 	} catch (err) {
	// 		Alert.alert("Error", "Server could not be reached")
	// 		setServerIsUp(false);
	// 	}
	// };

	const loginAndGetNearbyTeams = async () => {
		const response = await fetch('https://express.emilgth.dk/gameapi/nearbyplayers', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			// jeg har hardcoded position data ellers skulle jeg til at lægge nye teams in i DB
			body: JSON.stringify({
				"userName": userInfo.userName,
				"password": userInfo.password,
				"lon": 12.48,
				"lat": 55.77,
				"distance": 10000
			})
		});

		const json = await response.json();
		setOtherTeams(json);
		console.log(otherTeams)
	};

	const onCenterGameArea = () => {
		// (RED) Center map around the gameArea fetched from the backend
		//Hardcoded, should be calculated as center of polygon received from server
		const latitude = 55.777055745928664;
		const longitude = 12.55897432565689;
		mapRef.current.animateToRegion({
			latitude,
			longitude,
			latitudeDelta: 0.002,
			longitudeDelta: 0.04,
		}, 1000);
	};

	const sendRealPosToServer = async () => {
		//Upload users current position to the isuserinarea endpoint and present result
		const lat = position.latitude
		const lon = position.longitude;
		try {
			const status = await facade.isUserInArea(lon, lat);
			showStatusFromServer(setStatus, status);
		} catch (err) {
			setErrorMessage("Could not get result from server")
			setServerIsUp(false)
		}
	}

	const info = serverIsUp ? status : " Server is not up";
	return (
		<View style={{flex: 1, paddingTop: 20}}>
			<Modal
				animationType="slide"
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => {
					Alert.alert("Modal has been closed.");
				}}
			>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						<Text style={styles.modalText}>Enter login credentials:</Text>
						<TextInput
							style={{height: 40}}
							placeholder="Username!"
							onChangeText={text => setUserInfo({userName: text, password: userInfo.password})}
							defaultValue={'t1'}
						/>
						<TextInput
							style={{height: 40}}
							placeholder="Secret password!"
							onChangeText={text => setUserInfo({userName: userInfo.userName, password: text})}
							defaultValue={'secret'}
							secureTextEntry={true}
						/>
						<MyButton style={{flex: 2}}
						          onPressButton={loginAndGetNearbyTeams}
						          txt={'Lgoin!11'}/>
						<TouchableHighlight
							style={{...styles.openButton, backgroundColor: "#2196F3"}}
							onPress={() => {
								setModalVisible(!modalVisible);
							}}
						>
							<Text style={styles.textStyle}>Dismiss</Text>
						</TouchableHighlight>
					</View>
				</View>
			</Modal>

			{!region && <Text style={styles.fetching}>
				.. Fetching data</Text>}

			{/* Add MapView */}
			{region && <MapView
				ref={mapRef}
				style={{flex: 14}}
				// onPress={onMapPress}
				mapType="standard"
				region={region}
			>
				{/*App MapView.Polygon to show gameArea*/}
				{serverIsUp && <MapView.Polygon coordinates={gameArea}
				                                strokeWidth={1}
					// onPress={onMapPress}
					                            fillColor="rgba(128, 153, 177, 0.5)"/>
				}

				{/*App MapView.Marker to show users current position*/}
				<MapView.Marker title={'me'}
				                coordinate={{longitude: position.longitude, latitude: position.latitude}}
				/>
				{otherTeams.map(team => (
					//todo byt om på lat og lon i backend lolll
					<MapView.Marker title={team.userName}
					                coordinate={{longitude: team.lat, latitude: team.lon}}
					/>
				))}

			</MapView>
			}

			<Text style={{flex: 1, textAlign: "center", fontWeight: "bold"}}>
				Your position (lat,long): {position.latitude}, {position.longitude}
			</Text>
			<Text style={{flex: 1, textAlign: "center"}}>{info}</Text>
			<MyButton style={{flex: 2}} onPressButton={() => setModalVisible(!modalVisible)} txt={'Login!'}/>
			<MyButton style={{flex: 2}} onPressButton={sendRealPosToServer}
			          txt="Upload real Position"/>

			<MyButton style={{flex: 2}} onPressButton={() => onCenterGameArea()}
			          txt="Show Game Area"/>
		</View>
	);

}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: Constants.statusBarHeight,
		backgroundColor: '#ecf0f1',
	},
	touchable: {backgroundColor: "#4682B4", margin: 3},
	touchableTxt: {fontSize: 22, textAlign: "center", padding: 5},
	modalView: {
		margin: 20,
		backgroundColor: "white",
		borderRadius: 20,
		padding: 35,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5
	},
	fetching: {
		fontSize: 35, flex: 14,
		flexDirection: "row",
		justifyContent: 'center',
		alignItems: "center",
		paddingTop: Constants.statusBarHeight
	},
	paragraph: {
		margin: 24,
		fontSize: 18,
		textAlign: 'center',
	},
});

function showStatusFromServer(setStatus, status) {
	setStatus(status.msg);
	setTimeout(() => setStatus("- - - - - - - - - - - - - - - - - - - -"), 3000);
}
