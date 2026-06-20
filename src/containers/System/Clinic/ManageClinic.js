import React, { Component } from 'react';
import { connect } from "react-redux";
import { FormattedMessage } from 'react-intl';
import './ManageClinic.scss';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import CommonUtils from '../../../utils/CommonUtils';
import 'react-image-lightbox/style.css';
import Lightbox from 'react-image-lightbox';
import { getAllClinic, updateClinicInfo, createClinicInfo, deleteClinic, getALLCodeService } from '../../../services/userService';
import { toast } from 'react-toastify';

import { LANGUAGES } from '../../../utils';
const mdParser = new MarkdownIt(/* Markdown-it options */);

class ManageClinic extends Component {

    constructor(props) {
        super(props);
        this.state = {
            id: '',
            name: '',
            address: '',
            imageBase64: '',
            descriptionHTML: '',
            descriptionMarkdown: '',
            previewImgURL: '',
            isOpen: false,
            isEditMode: false, // true = update, false = create new
            listClinics: [],
            listAddresses: []
        }
    }

    async componentDidMount() {
        try {
            await this.fetchClinics();
            let resAddress = await getALLCodeService('CLINIC_ADDRESS');
            if (resAddress && resAddress.errCode === 0) {
                this.setState({
                    listAddresses: resAddress.data || []
                });
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu ban đầu:', error);
            toast.error("Lỗi khi tải dữ liệu địa chỉ");
        }
    }

    fetchClinics = async () => {
        try {
            let res = await getAllClinic();
            if (res && res.errCode === 0) {
                this.setState({
                    listClinics: res.data || []
                });
            } else {
                toast.error(res && res.errMessage ? res.errMessage : "Không thể tải danh sách phòng khám");
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách phòng khám:', error);
            toast.error("Lỗi kết nối đến server để tải phòng khám");
        }
    }

    handleEditClinic = (item) => {
        this.setState({
            id: item.id,
            name: item.name || '',
            address: item.address || '',
            descriptionHTML: item.descriptionHTML || '',
            descriptionMarkdown: item.descriptionMarkdown || '',
            previewImgURL: item.image || '',
            imageBase64: '',
            isEditMode: true
        });
    }

    handleDeleteClinic = async (item) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa phòng khám ${item.name}?`)) {
            let res = await deleteClinic({ id: item.id });
            if (res && res.errCode === 0) {
                toast.success("Xóa phòng khám thành công!");
                await this.fetchClinics();
                if (this.state.id === item.id) {
                    this.handleClearForm();
                }
            } else {
                toast.error("Xóa phòng khám thất bại!");
            }
        }
    }

    handleClearForm = () => {
        this.setState({
            id: '',
            name: '',
            address: '',
            imageBase64: '',
            descriptionHTML: '',
            descriptionMarkdown: '',
            previewImgURL: '',
            isEditMode: false
        });
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.language !== prevProps.language) {

        }

    }

    handleOnChangeInput = (event, id) => {
        let copyState = { ...this.state };
        copyState[id] = event.target.value;
        this.setState({
            ...copyState
        })
    }

    handleEditorChange = ({ html, text }) => {
        this.setState({
            descriptionHTML: html,
            descriptionMarkdown: text
        })
        //console.log('handleEditorChange', html, text);
    }

    handleOnChangeImage = async (event) => {
        let data = event.target.files;
        let file = data[0];
        if (file) {
            let base64 = await CommonUtils.compressImage(file);
            let objectUrl = URL.createObjectURL(file);

            this.setState({
                previewImgURL: objectUrl,
                imageBase64: base64
            })
        }
    }

    openPreviewImage = () => {
        if (!this.state.previewImgURL) return;
        this.setState({
            isOpen: true
        })
    }

    handleSaveClinic = async () => {
        if (this.state.isEditMode) {
            // UPDATE existing clinic
            if (!this.state.id) {
                toast.error("Không tìm thấy phòng khám để cập nhật!");
                return;
            }

            let updateData = {
                id: this.state.id,
                name: this.state.name,
                address: this.state.address,
                imageBase64: this.state.imageBase64,
                descriptionHTML: this.state.descriptionHTML,
                descriptionMarkdown: this.state.descriptionMarkdown
            };

            let res = await updateClinicInfo(updateData)
            if (res && res.errCode === 0) {
                toast.success("Cập nhật phòng khám thành công!");
                await this.fetchClinics();
                this.handleClearForm();
            } else {
                toast.error(res.errMessage || "Cập nhật phòng khám thất bại!");
            }
        } else {
            // CREATE new clinic
            if (!this.state.name || !this.state.address) {
                toast.error("Vui lòng nhập tên và địa chỉ phòng khám!");
                return;
            }

            let createData = {
                name: this.state.name,
                address: this.state.address,
                imageBase64: this.state.imageBase64,
                descriptionHTML: this.state.descriptionHTML,
                descriptionMarkdown: this.state.descriptionMarkdown
            };

            let res = await createClinicInfo(createData)
            if (res && res.errCode === 0) {
                toast.success("Tạo phòng khám thành công!");
                await this.fetchClinics();
                this.handleClearForm();
            } else {
                toast.error(res.errMessage || "Tạo phòng khám thất bại!");
            }
        }
    }

    render() {

        return (
            <div className='manage-clinic-container container-fluid'>
                {/* Form Card */}
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-body p-4">
                        {/* Header */}
                        <div className="row align-items-center mb-4">
                            <div className="col-md-6">
                                <h4 className="text-admin font-weight-bold mb-0">
                                    <i className="fa-solid fa-hospital me-2"></i>
                                    {this.props.language === LANGUAGES.VI ? 'Quản lý cơ sở phòng khám' : 'Manage Clinics'}
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {this.props.language === LANGUAGES.VI ? 'Tạo mới, chỉnh sửa thông tin các cơ sở phòng khám trong hệ thống' : 'Create and update clinic details in the system'}
                                </p>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className='row g-3 border-top pt-4'>
                            <div className='col-12 mb-2 fw-bold text-dark fs-6'>
                                <i className={`fa-solid ${this.state.isEditMode ? 'fa-edit' : 'fa-plus-circle'} me-2 text-admin`}></i>
                                {this.state.isEditMode 
                                    ? (this.props.language === LANGUAGES.VI ? 'Chỉnh sửa phòng khám' : 'Edit Clinic')
                                    : (this.props.language === LANGUAGES.VI ? 'Thêm mới phòng khám' : 'Add New Clinic')
                                }
                            </div>

                            <div className='col-md-6 col-sm-12'>
                                <label className="form-label fw-bold small text-secondary mb-2"><i className="fas fa-hospital-user me-1"></i> Tên phòng khám</label>
                                <input className='form-control'
                                    type='text'
                                    placeholder='Nhập tên phòng khám...'
                                    value={this.state.name}
                                    onChange={(event) => this.handleOnChangeInput(event, 'name')}
                                />
                            </div>

                            <div className='col-md-6 col-sm-12'>
                                <label className="form-label fw-bold small text-secondary mb-2"><i className="fas fa-map-marker-alt me-1"></i> Địa chỉ phòng khám</label>
                                <select className='form-control'
                                    value={this.state.address}
                                    onChange={(event) => this.handleOnChangeInput(event, 'address')}
                                >
                                    <option value="">Chọn địa chỉ phòng khám...</option>
                                    {this.state.listAddresses && this.state.listAddresses.length > 0 &&
                                        this.state.listAddresses.map((item, index) => {
                                            return (
                                                <option key={index} value={item.valueVi}>
                                                    {this.props.language === LANGUAGES.VI ? item.valueVi : item.valueEn}
                                                </option>
                                            )
                                        })
                                    }
                                </select>
                            </div>

                            <div className='col-12 mt-3'>
                                <label className="form-label fw-bold small text-secondary mb-2"><i className="fas fa-image me-1"></i> Ảnh phòng khám</label>
                                <div className='preview-img-container d-flex align-items-center gap-3'>
                                    <input id="previewImg" type='file' hidden
                                        onChange={(event) => this.handleOnChangeImage(event)}
                                    />
                                    <label className='btn btn-outline-admin btn-sm rounded-pill px-3 mb-0' htmlFor='previewImg'>
                                        Tải ảnh <i className="fa-solid fa-upload ms-1"></i>
                                    </label>

                                    {this.state.previewImgURL && (
                                        <div className='preview-image rounded border'
                                            style={{ 
                                                backgroundImage: `url(${this.state.previewImgURL})`,
                                                width: '100px',
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

                            <div className='col-12 mt-3'>
                                <label className="form-label fw-bold small text-secondary mb-2"><i className="fas fa-align-left me-1"></i> Mô tả chi tiết</label>
                                <div className="border rounded-3 overflow-hidden">
                                    <MdEditor
                                        style={{ height: '300px' }}
                                        renderHTML={text => mdParser.render(text)}
                                        onChange={this.handleEditorChange}
                                        value={this.state.descriptionMarkdown}
                                    />
                                </div>
                            </div>

                            <div className='col-12 mt-4'>
                                <div className='d-flex gap-2 justify-content-end'>
                                    {this.state.isEditMode && (
                                        <button className='btn btn-sm btn-outline-secondary rounded-pill px-4'
                                            onClick={() => this.handleClearForm()}
                                        >
                                            <i className="fa-solid fa-times me-1"></i> Hủy / Làm mới
                                        </button>
                                    )}
                                    <button className={`btn btn-sm rounded-pill px-4 ${this.state.isEditMode ? 'btn-warning text-white' : 'btn-admin'}`}
                                        onClick={() => this.handleSaveClinic()}
                                    >
                                        <i className={`fas ${this.state.isEditMode ? 'fa-save' : 'fa-plus-circle'} me-1`}></i>
                                        {this.state.isEditMode ? ' Cập Nhật' : ' Tạo Phòng Khám'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clinics List Card */}
                <div className="card shadow-sm border-0 rounded-3">
                    <div className="card-body p-4">
                        <div className="row align-items-center mb-4">
                            <div className="col-md-6">
                                <h4 className="text-admin font-weight-bold mb-0">
                                    <i className="fa-solid fa-list me-2"></i>
                                    Danh Sách Cơ Sở Phòng Khám
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {this.props.language === LANGUAGES.VI 
                                        ? `Tổng số: ${this.state.listClinics ? this.state.listClinics.length : 0} phòng khám`
                                        : `Total: ${this.state.listClinics ? this.state.listClinics.length : 0} clinics`
                                    }
                                </p>
                            </div>
                        </div>

                        <div className='table-responsive'>
                            <table className="table table-hover align-middle">
                                <thead className="table-light text-secondary">
                                    <tr>
                                        <th style={{ width: '80px' }}>STT</th>
                                        <th>Tên phòng khám</th>
                                        <th>Địa chỉ</th>
                                        <th className="text-center" style={{ width: '120px' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.listClinics && this.state.listClinics.length > 0 ? (
                                        this.state.listClinics.map((item, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td className="fw-bold text-dark">{item.name}</td>
                                                <td>{item.address}</td>
                                                <td className="text-center">
                                                    <div className="d-flex gap-2 justify-content-center">
                                                        <button
                                                            className="btn btn-sm btn-outline-admin px-2 rounded-pill"
                                                            onClick={() => this.handleEditClinic(item)}
                                                            title={this.props.language === LANGUAGES.VI ? 'Sửa' : 'Edit'}
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger px-2 rounded-pill"
                                                            onClick={() => this.handleDeleteClinic(item)}
                                                            title={this.props.language === LANGUAGES.VI ? 'Xóa' : 'Delete'}
                                                        >
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center text-muted">Không có cơ sở phòng khám nào.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
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
        language: state.app.language
    };
};

const mapDispatchToProps = dispatch => {
    return {
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageClinic);
