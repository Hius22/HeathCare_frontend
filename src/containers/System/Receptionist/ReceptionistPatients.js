import React, { Component } from 'react';
import { connect } from 'react-redux';
import { LANGUAGES } from '../../../utils';
import { getAllUsers, createNewUserService, editUserService, deleteUserService, getALLCodeService } from '../../../services/userService';
import { toast } from 'react-toastify';
import DatePicker from '../../../components/Input/DatePicker';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import moment from 'moment';

class ReceptionistPatients extends Component {
    constructor(props) {
        super(props);
        this.state = {
            patients: [],
            genders: [],
            searchKeyword: '',
            isLoading: false,

            // Modal state
            isOpenPatientModal: false,
            modalAction: 'CREATE', // CREATE or EDIT
            selectedPatientId: null,

            // Form inputs
            email: '',
            firstName: '',
            lastName: '',
            address: '',
            phonenumber: '',
            gender: '',
            birthday: new Date()
        }
    }

    async componentDidMount() {
        await this.loadPatients();
        await this.loadGenders();
    }

    loadPatients = async () => {
        this.setState({ isLoading: true });
        try {
            let res = await getAllUsers('ALL');
            if (res && res.errCode === 0) {
                // Filter users with roleId === 'R3' (Patients)
                let activePatients = res.users.filter(u => u.roleId === 'R3');
                this.setState({ patients: activePatients });
            } else {
                toast.error('Không thể tải danh sách bệnh nhân!');
            }
        } catch (error) {
            console.error('Error loading patients:', error);
            toast.error('Lỗi kết nối máy chủ');
        }
        this.setState({ isLoading: false });
    }

    loadGenders = async () => {
        try {
            let res = await getALLCodeService('GENDER');
            if (res && res.errCode === 0) {
                this.setState({
                    genders: res.data,
                    gender: res.data[0]?.keyMap || ''
                });
            }
        } catch (error) {
            console.error('Error loading genders:', error);
        }
    }

    handleSearchChange = (event) => {
        this.setState({ searchKeyword: event.target.value });
    }

    openCreateModal = () => {
        this.setState({
            modalAction: 'CREATE',
            selectedPatientId: null,
            email: '',
            firstName: '',
            lastName: '',
            address: '',
            phonenumber: '',
            gender: this.state.genders[0]?.keyMap || '',
            birthday: new Date(),
            isOpenPatientModal: true
        });
    }

    openEditModal = (patient) => {
        this.setState({
            modalAction: 'EDIT',
            selectedPatientId: patient.id,
            email: patient.email,
            firstName: patient.firstName || '',
            lastName: patient.lastName || '',
            address: patient.address || '',
            phonenumber: patient.phonenumber || '',
            gender: patient.gender || this.state.genders[0]?.keyMap || '',
            birthday: patient.birthday ? new Date(+patient.birthday) : new Date(),
            isOpenPatientModal: true
        });
    }

    closeModal = () => {
        this.setState({
            isOpenPatientModal: false,
            selectedPatientId: null,
            email: '',
            firstName: '',
            lastName: '',
            address: '',
            phonenumber: '',
            birthday: new Date()
        });
    }

    validateForm = () => {
        let { email, firstName, lastName, address, phonenumber } = this.state;
        let isVi = this.props.language === LANGUAGES.VI;

        if (!email || !firstName || !lastName || !address || !phonenumber) {
            toast.error(isVi ? 'Vui lòng điền đầy đủ các thông tin bắt buộc!' : 'Please fill all required fields!');
            return false;
        }

        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error(isVi ? 'Định dạng email không hợp lệ!' : 'Invalid email format!');
            return false;
        }

        return true;
    }

    handleSavePatient = async () => {
        if (!this.validateForm()) return;

        let { modalAction, selectedPatientId, email, firstName, lastName, address, phonenumber, gender, birthday } = this.state;
        let isVi = this.props.language === LANGUAGES.VI;

        let formattedBirthday = birthday ? new Date(birthday).getTime().toString() : '';

        try {
            let res;
            if (modalAction === 'CREATE') {
                res = await createNewUserService({
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    address: address,
                    phonenumber: phonenumber,
                    gender: gender,
                    roleId: 'R3',
                    positionId: 'NONE',
                    avatar: '',
                    birthday: formattedBirthday
                });
            } else {
                res = await editUserService({
                    id: selectedPatientId,
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    address: address,
                    phonenumber: phonenumber,
                    gender: gender,
                    roleId: 'R3',
                    birthday: formattedBirthday
                });
            }

            if (res && res.errCode === 0) {
                toast.success(isVi ? 'Lưu hồ sơ bệnh nhân thành công!' : 'Saved patient profile successfully!');
                this.closeModal();
                await this.loadPatients();
            } else {
                toast.error(res.errMessage || (isVi ? 'Lưu hồ sơ thất bại!' : 'Failed to save profile!'));
            }
        } catch (error) {
            console.error('Error saving patient:', error);
            toast.error('Lỗi máy chủ');
        }
    }

    handleDeletePatient = async (id) => {
        let isVi = this.props.language === LANGUAGES.VI;
        if (window.confirm(isVi ? 'Bạn có chắc chắn muốn xóa hồ sơ bệnh nhân này?' : 'Are you sure you want to delete this patient profile?')) {
            try {
                let res = await deleteUserService(id);
                if (res && res.errCode === 0) {
                    toast.success(isVi ? 'Xóa hồ sơ bệnh nhân thành công!' : 'Deleted patient profile successfully!');
                    await this.loadPatients();
                } else {
                    toast.error(res.errMessage || 'Lỗi xóa hồ sơ');
                }
            } catch (error) {
                console.error('Error deleting patient:', error);
                toast.error('Lỗi máy chủ');
            }
        }
    }

    render() {
        let { language } = this.props;
        let { patients, genders, searchKeyword, isOpenPatientModal, modalAction, email, firstName, lastName, address, phonenumber, gender, birthday, isLoading } = this.state;
        let isVi = language === LANGUAGES.VI;

        let filtered = patients.filter(p => {
            let kw = searchKeyword.toLowerCase().trim();
            if (!kw) return true;
            let fullName = `${p.lastName || ''} ${p.firstName || ''}`.toLowerCase();
            let phone = (p.phonenumber || '').toLowerCase();
            let emailAddr = (p.email || '').toLowerCase();
            let addressVal = (p.address || '').toLowerCase();
            return fullName.includes(kw) || phone.includes(kw) || emailAddr.includes(kw) || addressVal.includes(kw);
        });

        return (
            <div className="receptionist-patients-container container-fluid">
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-body p-4">
                        <div className="row align-items-center mb-3">
                            <div className="col-md-6">
                                <h4 className="text-primary font-weight-bold mb-0">
                                    <i className="fas fa-users-cog me-2"></i>
                                    {isVi ? 'Quản lý hồ sơ bệnh nhân' : 'Patient Directory'}
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {isVi ? 'Tạo mới, chỉnh sửa thông tin hành chính của bệnh nhân' : 'Create, view, and update patient administrative records'}
                                </p>
                            </div>
                            <div className="col-md-6 d-flex justify-content-md-end gap-3 mt-3 mt-md-0">
                                <div className="search-wrapper" style={{ width: '250px' }}>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0"><i className="fas fa-search text-muted"></i></span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0 ps-0"
                                            placeholder={isVi ? 'Tìm theo tên, SĐT, email...' : 'Search by name, phone...'}
                                            value={searchKeyword}
                                            onChange={this.handleSearchChange}
                                        />
                                    </div>
                                </div>
                                <button className="btn btn-purple px-3 rounded-pill" onClick={this.openCreateModal}>
                                    <i className="fas fa-user-plus me-1"></i>
                                    {isVi ? 'Thêm bệnh nhân' : 'Add Patient'}
                                </button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="table-responsive mt-4">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light text-secondary">
                                        <tr>
                                            <th>#</th>
                                            <th>{isVi ? 'Mã BN' : 'Patient ID'}</th>
                                            <th>{isVi ? 'Họ và tên' : 'Full Name'}</th>
                                            <th>{isVi ? 'Ngày sinh' : 'Birthday'}</th>
                                            <th>{isVi ? 'Giới tính' : 'Gender'}</th>
                                            <th>{isVi ? 'Điện thoại' : 'Phone'}</th>
                                            <th>{isVi ? 'Email' : 'Email'}</th>
                                            <th>{isVi ? 'Địa chỉ' : 'Address'}</th>
                                            <th className="text-center">{isVi ? 'Thao tác' : 'Actions'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered && filtered.length > 0 ? (
                                            filtered.map((patient, idx) => (
                                                <tr key={patient.id}>
                                                    <td>{idx + 1}</td>
                                                    <td className="text-monospace fw-bold text-secondary">#{patient.id}</td>
                                                    <td className="fw-bold text-dark">{patient.lastName} {patient.firstName}</td>
                                                    <td>{patient.birthday ? moment(+patient.birthday).format('DD/MM/YYYY') : '—'}</td>
                                                    <td>
                                                        {patient.genderData ? (isVi ? patient.genderData.valueVi : patient.genderData.valueEn) : '—'}
                                                    </td>
                                                    <td>{patient.phonenumber || '—'}</td>
                                                    <td>{patient.email}</td>
                                                    <td>{patient.address || '—'}</td>
                                                    <td className="text-center">
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary me-2 rounded-pill px-3"
                                                            onClick={() => this.openEditModal(patient)}
                                                        >
                                                            <i className="fas fa-edit"></i> {isVi ? 'Sửa' : 'Edit'}
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                                            onClick={() => this.handleDeletePatient(patient.id)}
                                                        >
                                                            <i className="fas fa-trash-alt"></i> {isVi ? 'Xóa' : 'Delete'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="9" className="text-center py-4 text-muted">
                                                    {isVi ? 'Không tìm thấy bệnh nhân nào' : 'No patients found'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create/Edit Patient Modal */}
                <Modal isOpen={isOpenPatientModal} toggle={this.closeModal} centered size="md">
                    <ModalHeader className="bg-purple text-white">
                        {modalAction === 'CREATE' ? (
                            <span><i className="fas fa-user-plus me-2"></i> {isVi ? 'Đăng ký bệnh nhân mới' : 'New Patient Registration'}</span>
                        ) : (
                            <span><i className="fas fa-user-edit me-2"></i> {isVi ? 'Cập nhật hồ sơ bệnh nhân' : 'Edit Patient Profile'}</span>
                        )}
                    </ModalHeader>
                    <ModalBody className="p-4">
                        <div className="row g-3">
                            <div className="col-12">
                                <label className="form-label fw-bold small text-secondary">
                                    {isVi ? 'Địa chỉ Email' : 'Email Address'} <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="email"
                                    className="form-control"
                                    disabled={modalAction === 'EDIT'}
                                    placeholder="patient@example.com"
                                    value={email}
                                    onChange={(e) => this.setState({ email: e.target.value })}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold small text-secondary">
                                    {isVi ? 'Họ đệm' : 'Last Name'} <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder={isVi ? 'Nguyễn Văn' : 'Smith'}
                                    value={lastName}
                                    onChange={(e) => this.setState({ lastName: e.target.value })}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold small text-secondary">
                                    {isVi ? 'Tên' : 'First Name'} <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder={isVi ? 'An' : 'John'}
                                    value={firstName}
                                    onChange={(e) => this.setState({ firstName: e.target.value })}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold small text-secondary">
                                    {isVi ? 'Ngày sinh' : 'Birthday'} <span className="text-danger">*</span>
                                </label>
                                <DatePicker
                                    onChange={(date) => this.setState({ birthday: date[0] })}
                                    className="form-control"
                                    value={birthday}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-bold small text-secondary">
                                    {isVi ? 'Giới tính' : 'Gender'} <span className="text-danger">*</span>
                                </label>
                                <select 
                                    className="form-select"
                                    value={gender}
                                    onChange={(e) => this.setState({ gender: e.target.value })}
                                >
                                    {genders && genders.map(g => (
                                        <option key={g.id} value={g.keyMap}>
                                            {isVi ? g.valueVi : g.valueEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-12">
                                <label className="form-label fw-bold small text-secondary">
                                    {isVi ? 'Số điện thoại' : 'Phone Number'} <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. 0987654321"
                                    value={phonenumber}
                                    onChange={(e) => this.setState({ phonenumber: e.target.value })}
                                />
                            </div>

                            <div className="col-12">
                                <label className="form-label fw-bold small text-secondary">
                                    {isVi ? 'Địa chỉ cư trú' : 'Residential Address'} <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder={isVi ? 'Số 12, Phố Huế, Hà Nội' : '123 Main St'}
                                    value={address}
                                    onChange={(e) => this.setState({ address: e.target.value })}
                                />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={this.closeModal}>
                            {isVi ? 'Hủy' : 'Cancel'}
                        </Button>
                        <Button className="btn-purple" onClick={this.handleSavePatient}>
                            <i className="fas fa-save me-1"></i>
                            {isVi ? 'Lưu hồ sơ' : 'Save Profile'}
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language,
    };
};

const mapDispatchToProps = dispatch => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(ReceptionistPatients);
