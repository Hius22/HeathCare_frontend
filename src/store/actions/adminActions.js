import actionTypes from './actionTypes';
import { getALLCodeService, createNewUserService, getAllUsers, deleteUserService, editUserService, getTopDoctorHomeService, getAllDoctors, saveDetailDoctorService } from '../../services/userService';
import { toast } from "react-toastify";

//fetch = get
// export const fetchGenderStart = () => ({
//     type: actionTypes.FETCH_GENDER_START
// })

export const fetchGenderStart = () => {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: actionTypes.FETCH_GENDER_START })

            let res = await getALLCodeService("GENDER");
            if (res && res.errCode === 0) {
                dispatch(fetchGenderSuccess(res.data));
            }
            else {
                dispatch(fetchGenderFailed());
            }
        } catch (e) {
            dispatch(fetchGenderFailed());
            console.log('fetchGenderStart error: ', e);
        }
    }

}

export const fetchGenderSuccess = (genderData) => ({
    type: actionTypes.FETCH_GENDER_SUCCESS,
    data: genderData
})

export const fetchGenderFailed = () => ({
    type: actionTypes.FETCH_GENDER_FAILED
})

export const fetchPositionStart = () => {
    return async (dispatch, getState) => {
        try {
            let res = await getALLCodeService("POSITION");
            if (res && res.errCode === 0) {
                dispatch(fetchPositionSuccess(res.data));
            }
            else {
                dispatch(fetchPositionFailed());
            }
        } catch (e) {
            dispatch(fetchPositionFailed());
            console.log('fetchPositionStart error: ', e);
        }
    }

}

export const fetchPositionSuccess = (positionData) => ({
    type: actionTypes.FETCH_POSITION_SUCCESS,
    data: positionData
})

export const fetchPositionFailed = () => ({
    type: actionTypes.FETCH_POSITION_FAILED
})

export const fetchRoleStart = () => {
    return async (dispatch, getState) => {
        try {
            let res = await getALLCodeService("ROLE");
            if (res && res.errCode === 0) {
                dispatch(fetchRoleSuccess(res.data));
            }
            else {
                dispatch(fetchRoleFailed());
            }
        } catch (e) {
            dispatch(fetchRoleFailed());
            console.log('fetchRoleStart error: ', e);
        }
    }

}

export const fetchRoleSuccess = (roleData) => ({
    type: actionTypes.FETCH_ROLE_SUCCESS,
    data: roleData
})

export const fetchRoleFailed = () => ({
    type: actionTypes.FETCH_ROLE_FAILED
})

export const createNewUser = (data) => {
    return async (dispatch, getState) => {
        try {
            let res = await createNewUserService(data);
            //console.log('check create: ', res);
            if (res && res.errCode === 0) {
                toast.success("Created a new user successfully!");
                dispatch(saveUserSuccess());
                dispatch(fetchAllUsersStart());
            }
            else {
                dispatch(saveUserFailed());
            }
        } catch (e) {
            dispatch(saveUserFailed());
            console.log('saveUserFailed error: ', e);
        }
    }
}

export const saveUserSuccess = () => ({
    type: actionTypes.CREATE_USER_SUCCESS
});

export const saveUserFailed = () => ({
    type: actionTypes.CREATE_USER_FAILED
});

export const fetchAllUsersStart = () => {
    return async (dispatch, getState) => {
        try {
            let res = await getAllUsers("ALL");
            if (res && res.errCode === 0) {
                dispatch(fetchAllUsersSuccess(res.users.reverse()));
            }
            else {
                toast.error("Could not get all user!");
                dispatch(fetchAllUsersFailed());
            }
        } catch (e) {
            toast.error("Could not get all user!");
            dispatch(fetchAllUsersFailed());
            console.log('fetchAllUsersFailed error: ', e);
        }
    }

}

export const fetchAllUsersSuccess = (data) => ({
    type: actionTypes.FETCH_ALL_USERS_SUCCESS,
    users: data
});

export const fetchAllUsersFailed = () => ({
    type: actionTypes.FETCH_ALL_USERS_FAILED
});

export const deleteAUser = (userId) => {
    return async (dispatch, getState) => {
        try {
            let res = await deleteUserService(userId);
            if (res && res.errCode === 0) {
                toast.success("Deleted a user successfully!");
                dispatch(deleteUserSuccess());
                dispatch(fetchAllUsersStart());
            }
            else {
                toast.error("Delete an unsuccessful user!");
                dispatch(deleteUserFailed());
            }
        } catch (e) {
            toast.error("Delete an unsuccessful user!");
            dispatch(deleteUserFailed());
            console.log('deleteUserFailed error: ', e);
        }
    }
}

export const deleteUserSuccess = () => ({
    type: actionTypes.DELETE_USER_SUCCESS
})
export const deleteUserFailed = () => ({
    type: actionTypes.DELETE_USER_FAILED
})

export const editAUser = (data) => {
    return async (dispatch, getState) => {
        try {
            let res = await editUserService(data);
            if (res && res.errCode === 0) {
                toast.success("Updated a user successfully!");
                dispatch(editUserSuccess());
                dispatch(fetchAllUsersStart());
            }
            else {
                toast.error("Updated an unsuccessful user!");
                dispatch(editUserFailed());
            }
        } catch (e) {
            toast.error("Updated an unsuccessful user!");
            dispatch(editUserFailed());
            console.log('editUserFailed error: ', e);
        }
    }
}

export const editUserSuccess = () => ({
    type: actionTypes.EDIT_USER_SUCCESS
})
export const editUserFailed = () => ({
    type: actionTypes.EDIT_USER_FAILED
})

export const fetchTopDoctor = () => {
    return async (dispatch, getState) => {
        try {
            let res = await getTopDoctorHomeService('')
            if (res && res.errCode === 0) {
                dispatch({
                    type: actionTypes.FETCH_TOP_DOCTORS_SUCCESS,
                    dataDoctors: res.data
                })
            } else {
                dispatch({
                    type: actionTypes.FETCH_TOP_DOCTORS_FAILED
                })
            }
        } catch (e) {
            console.log('FETCH_TOP_DOCTORS_FAILED: ', e)
            dispatch({
                type: actionTypes.FETCH_TOP_DOCTORS_FAILED
            })
        }
    }
}

export const fetchALLDoctors = () => {
    return async (dispatch, getState) => {
        try {
            let res = await getAllDoctors()
            if (res && res.errCode === 0) {
                dispatch({
                    type: actionTypes.FETCH_ALL_DOCTORS_SUCCESS,
                    dataDr: res.data
                })
            } else {
                dispatch({
                    type: actionTypes.FETCH_ALL_DOCTORS_FAILED
                })
            }
        } catch (e) {
            console.log('FETCH_ALL_DOCTORS_FAILED: ', e)
            dispatch({
                type: actionTypes.FETCH_ALL_DOCTORS_FAILED
            })
        }
    }
}

export const saveDetailDoctor = (data) => {
    return async (dispatch, getState) => {
        try {
            let res = await saveDetailDoctorService(data)
            if (res && res.errCode === 0) {
                toast.success("Saved detail doctor successfully!");
                dispatch({
                    type: actionTypes.SAVE_DETAIL_DOCTOR_SUCCESS
                })
            } else {
                toast.error("Saving doctor details failed!");
                dispatch({
                    type: actionTypes.SAVE_DETAIL_DOCTOR_FAILED
                })
            }
        } catch (e) {
            toast.error("Saving doctor details failed!");
            console.log('SAVE_DETAIL_DOCTOR_FAILED: ', e)
            dispatch({
                type: actionTypes.SAVE_DETAIL_DOCTOR_FAILED
            })
        }
    }
}

export const fetchAllScheduleTime = () => {
    return async (dispatch, getState) => {
        try {
            let res = await getALLCodeService("TIME")
            if (res && res.errCode === 0) {
                dispatch({
                    type: actionTypes.FETCH_ALLCODE_SCHEDULE_TIME_SUCCESS,
                    dataTime: res.data
                })
            } else {
                dispatch({
                    type: actionTypes.FETCH_ALLCODE_SCHEDULE_TIME_FAILED
                })
            }
        } catch (e) {
            console.log('FETCH_ALLCODE_SCHEDULE_TIME_FAILED: ', e)
            dispatch({
                type: actionTypes.FETCH_ALLCODE_SCHEDULE_TIME_FAILED
            })
        }
    }
}

export const getAllRequiredDoctorInfor = () => {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: actionTypes.FETCH_REQUIRED_DOCTOR_INFOR_START })

            let resPrice = await getALLCodeService("PRICE");
            let resPayment = await getALLCodeService("PAYMENT");
            let resProvince = await getALLCodeService("PROVINCE");

            if (resPrice && resPrice.errCode === 0 &&
                resPayment && resPayment.errCode === 0 &&
                resProvince && resProvince.errCode === 0) {
                let data = {
                    resPrice: resPrice.data,
                    resPayment: resPayment.data,
                    resProvince: resProvince.data
                }
                dispatch(fetchRequiredDoctorInforSuccess(data));
            }
            else {
                dispatch(fetchRequiredDoctorInforFailed());
            }
        } catch (e) {
            dispatch(fetchRequiredDoctorInforFailed());
            console.log('fetchRequiredDoctorInforFailed error: ', e);
        }
    }

}

export const fetchRequiredDoctorInforSuccess = (allRequiredData) => ({
    type: actionTypes.FETCH_REQUIRED_DOCTOR_INFOR_SUCCESS,
    data: allRequiredData
})

export const fetchRequiredDoctorInforFailed = () => ({
    type: actionTypes.FETCH_REQUIRED_DOCTOR_INFOR_FAILED
})