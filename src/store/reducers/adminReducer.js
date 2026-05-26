import actionTypes from '../actions/actionTypes';

const initialState = {
    isLoadingGender: false,
    genders: [],
    roles: [],
    positions: [],
    users: [],
    topDoctors: [],
    allDoctors: [],
    allScheduleTime: [],
    allRequiredDoctorInfor: {}
}

const adminReducer = (state = initialState, action) => {
    switch (action.type) {
        //gender
        case actionTypes.FETCH_GENDER_START:
            return {
                ...state,
                isLoadingGender: true
            }
        case actionTypes.FETCH_GENDER_SUCCESS:
            return {
                ...state,
                genders: action.data,
                isLoadingGender: false
            }
        case actionTypes.FETCH_GENDER_FAILED:
            return {
                ...state,
                isLoadingGender: false,
                genders: []
            }

        //position
        case actionTypes.FETCH_POSITION_SUCCESS:
            return {
                ...state,
                positions: action.data
            }
        case actionTypes.FETCH_POSITION_FAILED:
            return {
                ...state,
                positions: []
            }

        //role
        case actionTypes.FETCH_ROLE_SUCCESS:
            return {
                ...state,
                roles: action.data
            }
        case actionTypes.FETCH_ROLE_FAILED:
            return {
                ...state,
                roles: []
            }

        //users
        case actionTypes.FETCH_ALL_USERS_SUCCESS:
            return {
                ...state,
                users: action.users
            }
        case actionTypes.FETCH_ALL_USERS_FAILED:
            return {
                ...state,
                users: []
            }

        //get top doctors
        case actionTypes.FETCH_TOP_DOCTORS_SUCCESS:
            return {
                ...state,
                topDoctors: action.dataDoctors
            }
        case actionTypes.FETCH_TOP_DOCTORS_FAILED:
            return {
                ...state,
                topDoctors: []
            }

        //get all doctors
        case actionTypes.FETCH_ALL_DOCTORS_SUCCESS:
            return {
                ...state,
                allDoctors: action.dataDr
            }
        case actionTypes.FETCH_ALL_DOCTORS_FAILED:
            return {
                ...state,
                allDoctors: []
            }

        //get all time
        case actionTypes.FETCH_ALLCODE_SCHEDULE_TIME_SUCCESS:
            return {
                ...state,
                allScheduleTime: action.dataTime
            }
        case actionTypes.FETCH_ALLCODE_SCHEDULE_TIME_FAILED:
            return {
                ...state,
                allScheduleTime: []
            }

        //get price, payment, province
        case actionTypes.FETCH_REQUIRED_DOCTOR_INFOR_SUCCESS:
            return {
                ...state,
                allRequiredDoctorInfor: action.data
            }
        case actionTypes.FETCH_REQUIRED_DOCTOR_INFOR_FAILED:
            return {
                ...state,
                allRequiredDoctorInfor: {}
            }

        default:
            return state;
    }
}

export default adminReducer;