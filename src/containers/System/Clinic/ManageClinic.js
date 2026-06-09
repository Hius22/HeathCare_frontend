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
            <div className='manage-clinic-container'>
                <div className='clinic-header'>
                    <i className="fas fa-hospital"></i> Thông Tin Phòng Khám
                </div>

                <div className='clinic-form'>
                    <div className='row'>
                        <div className='col-6 form-group'>
                            <label><i className="fas fa-hospital-user"></i> Tên phòng khám</label>
                            <input className='form-control'
                                type='text'
                                placeholder='Nhập tên phòng khám...'
                                value={this.state.name}
                                onChange={(event) => this.handleOnChangeInput(event, 'name')}
                            />
                        </div>

                        <div className='col-6 form-group'>
                            <label><i className="fas fa-map-marker-alt"></i> Địa chỉ phòng khám</label>
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

                        <div className='col-6 form-group'>
                            <label><i className="fas fa-image"></i> Ảnh phòng khám</label>
                            <div className='preview-img-container'>
                                <input id="previewImg" type='file' hidden
                                    onChange={(event) => this.handleOnChangeImage(event)}
                                />
                                <label className='label-upload' htmlFor='previewImg'>
                                    <i className="fas fa-cloud-upload-alt"></i> Tải ảnh lên
                                </label>

                                <div className='preview-image'
                                    style={{ backgroundImage: `url(${this.state.previewImgURL})` }}
                                    onClick={() => this.openPreviewImage()}
                                >
                                    {!this.state.previewImgURL && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '100%',
                                            color: '#999',
                                            fontSize: '14px'
                                        }}>
                                            <i className="fas fa-image" style={{ fontSize: '48px', marginBottom: '10px' }}></i>
                                            <br />Xem trước ảnh
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className='col-12 form-group'>
                            <label><i className="fas fa-align-left"></i> Mô tả chi tiết</label>
                            <div className='editor-container'>
                                <MdEditor
                                    style={{ height: '400px' }}
                                    renderHTML={text => mdParser.render(text)}
                                    onChange={this.handleEditorChange}
                                    value={this.state.descriptionMarkdown}
                                />
                            </div>
                        </div>

                        <div className='col-12 btn-actions-container' style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button className='btn-save-clinic'
                                onClick={() => this.handleSaveClinic()}
                            >
                                <i className={`fas ${this.state.isEditMode ? 'fa-save' : 'fa-plus-circle'}`}></i>
                                {this.state.isEditMode ? ' Cập Nhật Thông Tin' : ' Tạo Phòng Khám'}
                            </button>
                            {this.state.isEditMode && (
                                <button className='btn btn-secondary'
                                    onClick={() => this.handleClearForm()}
                                    style={{ padding: '10px 20px', borderRadius: '4px' }}
                                >
                                    Hủy / Làm mới
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className='clinic-list-table' style={{ marginTop: '45px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#191c1e' }}>
                        <i className="fas fa-list"></i> Danh Sách Cơ Sở Phòng Khám
                    </h3>
                    <table className="table table-hover table-bordered">
                        <thead className="thead-light">
                            <tr>
                                <th>STT</th>
                                <th>Tên phòng khám</th>
                                <th>Địa chỉ</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.listClinics && this.state.listClinics.length > 0 ? (
                                this.state.listClinics.map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{item.name}</td>
                                        <td>{item.address}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => this.handleEditClinic(item)}
                                                    title={this.props.language === LANGUAGES.VI ? 'Sửa' : 'Edit'}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="btn-delete"
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
                                    <td colSpan="4" className="text-center">Không có cơ sở phòng khám nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
