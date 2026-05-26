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
                <div className="table-container">
                    <div className="table-header">
                        <h3><i className="fas fa-users"></i> Danh Sách Người Dùng</h3>
                        <span className="user-count">Tổng: {arrUsers ? arrUsers.length : 0} người dùng</span>
                    </div>

                    <div className="table-wrapper">
                        <table id='TableManageUser'>
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Avatar</th>
                                    <th>Email</th>
                                    <th>Họ tên</th>
                                    <th>Số điện thoại</th>
                                    <th>Giới tính</th>
                                    <th>Chức vụ</th>
                                    <th>Vai trò</th>
                                    <th>Địa chỉ</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {arrUsers && arrUsers.length > 0 &&
                                    arrUsers.map((item, index) => {
                                        let fullName = `${item.lastName} ${item.firstName}`;
                                        let genderDisplay = item.genderData ?
                                            (language === 'vi' ? item.genderData.valueVi : item.genderData.valueEn)
                                            : item.gender;
                                        let positionDisplay = item.positionData ?
                                            (language === 'vi' ? item.positionData.valueVi : item.positionData.valueEn)
                                            : item.positionId;
                                        let roleDisplay = item.roleId === 'R1' ? 'Admin' :
                                            item.roleId === 'R2' ? 'Doctor' : 'Patient';

                                        // Handle image display
                                        let avatarDisplay = 'https://ui-avatars.com/api/?name=' +
                                            encodeURIComponent(item.firstName + ' ' + item.lastName) +
                                            '&background=667eea&color=fff&size=100';

                                        if (item.image) {
                                            try {
                                                avatarDisplay = `data:image/jpeg;base64,${item.image}`;
                                            } catch (e) {
                                                // Keep default avatar if image conversion fails
                                            }
                                        }

                                        return (
                                            <tr key={item.id || index}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <img
                                                        src={avatarDisplay}
                                                        alt="Avatar"
                                                        className="user-avatar"
                                                    />
                                                </td>
                                                <td className="email-cell">{item.email}</td>
                                                <td className="name-cell">{fullName}</td>
                                                <td>{item.phonenumber || '-'}</td>
                                                <td>
                                                    <span className="badge badge-gender">
                                                        {genderDisplay}
                                                    </span>
                                                </td>
                                                <td>{positionDisplay || '-'}</td>
                                                <td>
                                                    <span className={`badge badge-role badge-${item.roleId.toLowerCase()}`}>
                                                        {roleDisplay}
                                                    </span>
                                                </td>
                                                <td className="address-cell" title={item.address}>
                                                    {item.address || '-'}
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            onClick={() => this.handleEditUser(item)}
                                                            className='btn-edit'
                                                            title="Sửa">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => this.handleDeleteUser(item)}
                                                            className='btn-delete'
                                                            title="Xóa">
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
                                        <td colSpan="10" className="empty-message">
                                            <i className="fas fa-inbox"></i>
                                            <p>Không có dữ liệu người dùng</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
