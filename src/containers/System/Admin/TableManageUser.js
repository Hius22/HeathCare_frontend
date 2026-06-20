import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import './TableManageUser.scss';
import * as actions from "../../../store/actions";


class TableManageUser extends Component {

    constructor(props) {
        super(props);
        this.state = {
            usersRedux: [],
        }
    }

    componentDidMount() {
        this.props.fetchUserRedux();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.listUsers !== this.props.listUsers) {
            this.setState({
                usersRedux: this.props.listUsers
            })
        }
    }

    handleDeleteUser = (user) => {
        this.props.deleteAUserRedux(user.id);
    }

    handleEditUser = (user) => {
        this.props.handleEditUserFromParent(user)
    }

    render() {
        //console.log('Check all users:', this.props.listUsers);
        //console.log('check setSate: ', this.state.usersRedux);
        let arrUsers = this.state.usersRedux;
        let language = this.props.language;

        return (
            <React.Fragment>
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-body p-4">
                        <div className="row align-items-center mb-4">
                            <div className="col-md-6">
                                <h4 className="text-admin font-weight-bold mb-0">
                                    <i className="fas fa-users me-2"></i>
                                    {language === 'vi' ? 'Danh Sách Người Dùng' : 'User List'}
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {language === 'vi' ? `Tổng cộng: ${arrUsers ? arrUsers.length : 0} người dùng` : `Total: ${arrUsers ? arrUsers.length : 0} users`}
                                </p>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light text-secondary">
                                    <tr>
                                        <th>#</th>
                                        <th>Email</th>
                                        <th>{language === 'vi' ? 'Họ tên' : 'Full Name'}</th>
                                        <th>{language === 'vi' ? 'Số điện thoại' : 'Phone'}</th>
                                        <th>{language === 'vi' ? 'Giới tính' : 'Gender'}</th>
                                        <th>{language === 'vi' ? 'Chức vụ' : 'Position'}</th>
                                        <th>{language === 'vi' ? 'Vai trò' : 'Role'}</th>
                                        <th>{language === 'vi' ? 'Địa chỉ' : 'Address'}</th>
                                        <th className="text-center">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {arrUsers && arrUsers.length > 0 &&
                                        arrUsers.map((item, index) => {
                                            let fullName = item.lastName ? `${item.lastName} ${item.firstName}` : item.firstName;
                                            let genderDisplay = item.genderData ?
                                                (language === 'vi' ? item.genderData.valueVi : item.genderData.valueEn)
                                                : item.gender;
                                            let positionDisplay = item.positionData ?
                                                (language === 'vi' ? item.positionData.valueVi : item.positionData.valueEn)
                                                : item.positionId;
                                            
                                            let roleDisplay = '';
                                            let roleBg = '';
                                            if (item.roleId === 'R1') {
                                                roleDisplay = 'Admin';
                                                roleBg = 'bg-danger-light text-danger border border-danger-subtle';
                                            } else if (item.roleId === 'R2') {
                                                roleDisplay = language === 'vi' ? 'Bác sĩ' : 'Doctor';
                                                roleBg = 'bg-primary-light text-primary border border-primary-subtle';
                                            } else if (item.roleId === 'R4') {
                                                roleDisplay = language === 'vi' ? 'Lễ tân' : 'Receptionist';
                                                roleBg = 'bg-purple-light text-dark border border-purple-subtle';
                                            } else {
                                                roleDisplay = language === 'vi' ? 'Bệnh nhân' : 'Patient';
                                                roleBg = 'bg-success-light text-success border border-success-subtle';
                                            }

                                            return (
                                                <tr key={item.id || index}>
                                                    <td>{index + 1}</td>
                                                    <td className="fw-medium text-dark">{item.email}</td>
                                                    <td className="fw-bold">{fullName}</td>
                                                    <td>{item.phonenumber || '—'}</td>
                                                    <td>
                                                        <span className="badge bg-light text-dark border p-1 px-2 small">
                                                            {genderDisplay}
                                                        </span>
                                                    </td>
                                                    <td>{positionDisplay || '—'}</td>
                                                    <td>
                                                        <span className={`badge p-1 px-2 small ${roleBg}`}>
                                                            {roleDisplay}
                                                        </span>
                                                    </td>
                                                    <td title={item.address}>
                                                        <div className="text-truncate" style={{ maxWidth: '180px' }}>
                                                            {item.address || '—'}
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="d-flex gap-2 justify-content-center">
                                                            <button
                                                                onClick={() => this.handleEditUser(item)}
                                                                className='btn btn-sm btn-outline-admin px-2 rounded-pill'
                                                                title={language === 'vi' ? 'Sửa' : 'Edit'}>
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => this.handleDeleteUser(item)}
                                                                className='btn btn-sm btn-outline-danger px-2 rounded-pill'
                                                                title={language === 'vi' ? 'Xóa' : 'Delete'}>
                                                                <i className="fas fa-trash-alt"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }

                                    {(!arrUsers || arrUsers.length === 0) && (
                                        <tr>
                                            <td colSpan="9" className="text-center py-4 text-muted">
                                                <i className="fas fa-inbox me-2"></i>
                                                {language === 'vi' ? 'Không có dữ liệu người dùng' : 'No user data'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }

}

const mapStateToProps = state => {
    return {
        listUsers: state.admin.users,
        language: state.app.language
    };
};

const mapDispatchToProps = dispatch => {
    return {
        fetchUserRedux: () => dispatch(actions.fetchAllUsersStart()),
        deleteAUserRedux: (id) => dispatch(actions.deleteAUser(id))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(TableManageUser);
