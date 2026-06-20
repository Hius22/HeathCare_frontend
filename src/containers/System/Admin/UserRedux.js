import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { getALLCodeService } from '../../../services/userService';
import { LANGUAGES, CRUD_ACTIONS } from "../../../utils";
import CommonUtils from "../../../utils/CommonUtils";
import * as actions from "../../../store/actions";
import './UserRedux.scss';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';
import TableManageUser from './TableManageUser';
import { toast } from 'react-toastify';

class UserRedux extends Component {
    constructor(props) {
        super(props);
        this.state = {
            genderArr: [],
            positionArr: [],
            roleArr: [],
            previewImgURL: '',
            isOpen: false,

            email: '',
            password: '',
            firstName: '',
            lastName: '',
            phoneNumber: '',
            address: '',
            gender: '',
            position: '',
            role: '',
            avatar: '',

            action: '',
            userEditId: ''
        }

    }

    async componentDidMount() {
        this.props.getGenderStart();
        this.props.getPositionStart();
        this.props.getRoleStart();
        // this.props.dispatch(actions.fetchGenderStart())
        // try {
        //     let res = await getALLCodeService('gender');
        //     if (res && res.errCode === 0) {
        //         this.setState({
        //             genderArr: res.data
        //         })
        //     }
        //     //console.log("check res: ", res);
        // } catch (e) {
        //     console.log(e);
        // }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.genderRedux !== this.props.genderRedux) {
            let arrGenders = this.props.genderRedux;
            this.setState({
                genderArr: arrGenders,
                gender: arrGenders && arrGenders.length > 0 ? arrGenders[0].keyMap : ''
            })
        }

        if (prevProps.positionRedux !== this.props.positionRedux) {
            let arrPositions = this.props.positionRedux;
            this.setState({
                positionArr: arrPositions,
                position: arrPositions && arrPositions.length > 0 ? arrPositions[0].keyMap : ''
            })
        }

        if (prevProps.roleRedux !== this.props.roleRedux) {
            let arrRoles = this.props.roleRedux;
            this.setState({
                roleArr: arrRoles,
                role: arrRoles && arrRoles.length > 0 ? arrRoles[0].keyMap : ''
            })
        }

        if (prevProps.listUsers !== this.props.listUsers) {
            let arrGenders = this.props.genderRedux;
            let arrPositions = this.props.positionRedux;
            let arrRoles = this.props.roleRedux;
            this.setState({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                phoneNumber: '',
                address: '',
                gender: arrGenders && arrGenders.length > 0 ? arrGenders[0].keyMap : '',
                position: arrPositions && arrPositions.length > 0 ? arrPositions[0].keyMap : '',
                role: arrRoles && arrRoles.length > 0 ? arrRoles[0].keyMap : '',
                avatar: '',
                action: CRUD_ACTIONS.CREATE,
                previewImgURL: ''
            })
        }
    }

    handleOnChangeImage = async (event) => {
        let data = event.target.files;
        let file = data[0];
        if (file) {
            let base64 = await CommonUtils.compressImage(file);
            let objectUrl = URL.createObjectURL(file);
            this.setState({
                previewImgURL: objectUrl,
                avatar: base64
            })
        }
    }

    openPreviewImage = () => {
        if (!this.state.previewImgURL) return;
        this.setState({
            isOpen: true
        })
    }

    handleSaveUser = () => {
        let isValid = this.checkValidateInput();
        if (isValid === false) return;

        let action = this.state.action;

        if (action === CRUD_ACTIONS.CREATE) {
            //fire redux create user
            this.props.createNewUser({
                email: this.state.email,
                password: this.state.password,
                firstName: this.state.firstName,
                lastName: this.state.lastName,
                address: this.state.address,
                gender: this.state.gender,
                phonenumber: this.state.phoneNumber,
                roleId: this.state.role,
                positionId: this.state.role === 'R2' ? this.state.position : '',
                avatar: this.state.avatar
            })
        }
        if (action === CRUD_ACTIONS.EDIT) {
            //fire redux edit user
            this.props.editAUserRedux({
                id: this.state.userEditId,
                email: this.state.email,
                password: this.state.password,
                firstName: this.state.firstName,
                lastName: this.state.lastName,
                address: this.state.address,
                gender: this.state.gender,
                phonenumber: this.state.phoneNumber,
                roleId: this.state.role,
                positionId: this.state.role === 'R2' ? this.state.position : '',
                avatar: this.state.avatar
            })
        }
    }

    checkValidateInput = () => {
        let isValid = true;
        let arrCheck = [];
        if (this.state.action === CRUD_ACTIONS.CREATE) {
            arrCheck = ['email', 'password', 'firstName', 'phoneNumber', 'address'];
            if (this.state.role !== 'R3') {
                arrCheck.push('lastName');
            }
        } else { // EDIT
            arrCheck = ['email', 'firstName', 'phoneNumber', 'address'];
            if (this.state.role !== 'R3') {
                arrCheck.push('lastName');
            }
        }
        for (let i = 0; i < arrCheck.length; i++) {
            if (!this.state[arrCheck[i]]) {
                isValid = false;
                let fieldNameVi = '';
                switch (arrCheck[i]) {
                    case 'email': fieldNameVi = 'Email'; break;
                    case 'password': fieldNameVi = 'Mật khẩu'; break;
                    case 'firstName': fieldNameVi = 'Tên'; break;
                    case 'lastName': fieldNameVi = 'Họ'; break;
                    case 'phoneNumber': fieldNameVi = 'Số điện thoại'; break;
                    case 'address': fieldNameVi = 'Địa chỉ'; break;
                    default: fieldNameVi = arrCheck[i];
                }
                toast.error(`Vui lòng điền trường bắt buộc: ${fieldNameVi}`);
                break;
            }
        }
        return isValid;
    }

    onChangeInput = (event, id) => {
        let copyState = { ...this.state }
        copyState[id] = event.target.value;
        if (id === 'role' && event.target.value !== 'R2') {
            copyState['position'] = '';
        }
        this.setState({
            ...copyState
        })
    }

    handleEditUserFromParent = (user) => {
        let imageBase64 = '';
        if (user.image) {
            // getAllUsers returns raw base64 string from DB, use data URL format for preview
            imageBase64 = `data:image/jpeg;base64,${user.image}`;
        }

        //console.log('check handle edit user: ', user)
        this.setState({
            email: user.email,
            password: 'HARDCODE',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phoneNumber: user.phonenumber || '',
            address: user.address || '',
            gender: user.gender || '',
            position: user.positionId || '',
            role: user.roleId || '',
            avatar: '',
            previewImgURL: imageBase64,
            action: CRUD_ACTIONS.EDIT,
            userEditId: user.id,
        })
    }

    render() {
        let genders = this.state.genderArr;
        let positions = this.state.positionArr;
        let roles = this.state.roleArr;
        let language = this.props.language;
        let isGetGender = this.props.isLoadingGender;

        let { email, password, firstName, lastName, phoneNumber, address, gender, position, role, avatar } = this.state;


        return (
            <div className="user-redux-container container-fluid" >
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-body p-4">
                        {/* Header */}
                        <div className="row align-items-center mb-4">
                            <div className="col-md-6">
                                <h4 className="text-admin font-weight-bold mb-0">
                                    <i className="fa-solid fa-users-gear me-2"></i>
                                    <FormattedMessage id='manage-user.user-manage' />
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {language === LANGUAGES.VI ? 'Quản lý, thêm mới và cập nhật thông tin người dùng trong hệ thống' : 'Manage, create and update system users'}
                                </p>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="row g-3 border-top pt-4">
                            <div className='col-12 mb-2 fw-bold text-dark fs-6'>
                                <FormattedMessage id='manage-user.add' />
                                {isGetGender === true ? ' (Loading genders...)' : ''}
                            </div>
                            
                            <div className='col-md-3 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id='manage-user.email' /></label>
                                <input className='form-control' type='email'
                                    value={email}
                                    onChange={(event) => { this.onChangeInput(event, 'email') }}
                                    disabled={this.state.action === CRUD_ACTIONS.EDIT ? true : false}
                                />
                            </div>
                            <div className='col-md-3 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id='manage-user.password' /></label>
                                <input className='form-control' type='password'
                                    value={password}
                                    onChange={(event) => { this.onChangeInput(event, 'password') }}
                                    disabled={this.state.action === CRUD_ACTIONS.EDIT ? true : false}
                                />
                            </div>
                            <div className='col-md-3 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id='manage-user.first-name' /></label>
                                <input className='form-control' type='text'
                                    value={firstName}
                                    onChange={(event) => { this.onChangeInput(event, 'firstName') }}
                                />
                            </div>
                            <div className='col-md-3 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id='manage-user.last-name' /></label>
                                <input className='form-control' type='text'
                                    value={lastName}
                                    onChange={(event) => { this.onChangeInput(event, 'lastName') }}
                                />
                            </div>
                            <div className='col-md-3 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id='manage-user.phone-number' /></label>
                                <input className='form-control' type='text'
                                    value={phoneNumber}
                                    onChange={(event) => { this.onChangeInput(event, 'phoneNumber') }}
                                />
                            </div>
                            <div className='col-md-9 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id='manage-user.address' /></label>
                                <input className='form-control' type='text'
                                    value={address}
                                    onChange={(event) => { this.onChangeInput(event, 'address') }}
                                />
                            </div>
                            <div className='col-md-3 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id='manage-user.gender' /></label>
                                <select className='form-control'
                                    value={gender}
                                    onChange={(event) => { this.onChangeInput(event, 'gender') }}
                                >
                                    {genders && genders.length > 0 &&
                                        genders.map((item, index) => {
                                            return (
                                                <option key={index} value={item.keyMap}>
                                                    {language === LANGUAGES.VI ? item.valueVi : item.valueEn}
                                                </option>
                                            )
                                        })
                                    }
                                </select>
                            </div>
                            <div className='col-md-3 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id='manage-user.position' /></label>
                                <select className='form-control'
                                    value={position}
                                    onChange={(event) => { this.onChangeInput(event, 'position') }}
                                    disabled={role !== 'R2'}
                                >
                                    {positions && positions.length > 0 &&
                                        positions.map((item, index) => {
                                            return (
                                                <option key={index} value={item.keyMap}>
                                                    {language === LANGUAGES.VI ? item.valueVi : item.valueEn}
                                                </option>
                                            )
                                        })
                                    }
                                </select>
                            </div>
                            <div className='col-md-3 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id='manage-user.role' /></label>
                                <select className='form-control'
                                    value={role}
                                    onChange={(event) => { this.onChangeInput(event, 'role') }}
                                >
                                    {roles && roles.length > 0 &&
                                        roles.map((item, index) => {
                                            return (
                                                <option key={index} value={item.keyMap}>
                                                    {language === LANGUAGES.VI ? item.valueVi : item.valueEn}
                                                </option>
                                            )
                                        })
                                    }
                                </select>
                            </div>
                            <div className='col-md-3 col-sm-6'>
                                <label className="form-label fw-bold small text-secondary mb-2"><FormattedMessage id='manage-user.image' /></label>
                                <div className='preview-img-container d-flex align-items-center gap-3'>
                                    <input id="previewImg" type='file' hidden
                                        onChange={(event) => this.handleOnChangeImage(event)}
                                    />
                                    <label className='btn btn-outline-admin btn-sm rounded-pill px-3 mb-0' htmlFor='previewImg'>
                                        Tải ảnh <i className="fa-solid fa-upload ms-1"></i>
                                    </label>
                                    {this.state.previewImgURL && (
                                        <div className='preview-image rounded-circle border'
                                            style={{ 
                                                backgroundImage: `url(${this.state.previewImgURL})`,
                                                width: '45px',
                                                height: '45px',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                cursor: 'pointer'
                                             }}
                                            onClick={() => this.openPreviewImage()}
                                        >
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className='col-12 mt-4'>
                                <button className={`btn btn-sm rounded-pill px-4 ${
                                    this.state.action === CRUD_ACTIONS.EDIT ? 'btn-warning text-white' : 'btn-admin'
                                }`}
                                    onClick={() => this.handleSaveUser()}
                                >
                                    {this.state.action === CRUD_ACTIONS.EDIT ? <FormattedMessage id='manage-user.edit' /> : <FormattedMessage id='manage-user.save' />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='mb-5'>
                    <TableManageUser
                        handleEditUserFromParent={this.handleEditUserFromParent}
                        action={this.state.action}
                    />
                </div>

                {this.state.isOpen === true &&
                    <Lightbox
                        mainSrc={this.state.previewImgURL}
                        onCloseRequest={() => this.setState({ isOpen: false })}
                    />
                }
            </div>
        )
    }

}

const mapStateToProps = state => {
    return {
        language: state.app.language,
        genderRedux: state.admin.genders,
        roleRedux: state.admin.roles,
        positionRedux: state.admin.positions,
        isLoadingGender: state.admin.isLoadingGender,
        listUsers: state.admin.users
    };
};

const mapDispatchToProps = dispatch => {
    return {
        getGenderStart: () => dispatch(actions.fetchGenderStart()),
        getPositionStart: () => dispatch(actions.fetchPositionStart()),
        getRoleStart: () => dispatch(actions.fetchRoleStart()),
        createNewUser: (data) => dispatch(actions.createNewUser(data)),
        fetchUserRedux: () => dispatch(actions.fetchAllUsersStart()),
        editAUserRedux: (data) => dispatch(actions.editAUser(data)),

        // processLogout: () => dispatch(actions.processLogout()),
        // changeLanguageAppRedux: (language) => dispatch(actions.changeLanguageApp(language))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(UserRedux);
