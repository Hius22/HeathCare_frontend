import React, { Component } from 'react';
import { connect } from "react-redux";
import { FormattedMessage } from 'react-intl';
import './ManageSpecialty.scss';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import { LANGUAGES } from '../../../utils';
import CommonUtils from '../../../utils/CommonUtils';
import 'react-image-lightbox/style.css';
import Lightbox from 'react-image-lightbox';
import { createNewSpecialty, getAllSpecialty, updateSpecialty, deleteSpecialty } from '../../../services/userService';
import { toast } from 'react-toastify';
import moment from 'moment';

const mdParser = new MarkdownIt(/* Markdown-it options */);

class ManageSpecialty extends Component {

    constructor(props) {
        super(props);
        this.state = {
            name: '',
            imageBase64: '',
            descriptionHTML: '',
            descriptionMarkdown: '',
            previewImgURL: '',
            isOpen: false,
            specialties: [],
            isLoading: false,
            editingId: null,
            searchKeyword: ''
        }
    }

    async componentDidMount() {
        this.loadSpecialties();
    }

    loadSpecialties = async () => {
        this.setState({ isLoading: true });
        try {
            let res = await getAllSpecialty();
            if (res && res.errCode === 0) {
                this.setState({
                    specialties: res.data
                });
            }
        } catch (error) {
            console.error('Error loading specialties:', error);
            toast.error('Không thể tải danh sách chuyên khoa');
        }
        this.setState({ isLoading: false });
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

    handleSaveNewSpecialty = async () => {
        let { editingId } = this.state;

        if (!this.state.name) {
            toast.error('Vui lòng nhập tên chuyên khoa');
            return;
        }

        let res;
        if (editingId) {
            // Update existing specialty
            res = await updateSpecialty({
                ...this.state,
                id: editingId
            });

            if (res && res.errCode === 0) {
                toast.success("Cập nhật chuyên khoa thành công!");
                this.resetForm();
                await this.loadSpecialties();
            } else {
                toast.error("Cập nhật chuyên khoa thất bại!");
            }
        } else {
            // Create new specialty
            res = await createNewSpecialty(this.state);
            if (res && res.errCode === 0) {
                toast.success("Tạo chuyên khoa thành công!");
                this.resetForm();
                await this.loadSpecialties();
            } else {
                toast.error("Tạo chuyên khoa thất bại!");
            }
        }
    }

    resetForm = () => {
        this.setState({
            name: '',
            imageBase64: '',
            descriptionHTML: '',
            descriptionMarkdown: '',
            previewImgURL: '',
            editingId: null
        });
    }

    handleEditSpecialty = (specialty) => {
        this.setState({
            name: specialty.name || '',
            imageBase64: '',
            descriptionHTML: specialty.descriptionHTML || '',
            descriptionMarkdown: specialty.descriptionMarkdown || '',
            previewImgURL: specialty.image || '',
            editingId: specialty.id
        });

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    handleDeleteSpecialty = async (specialtyId) => {
        let { language } = this.props;
        let confirmText = language === LANGUAGES.VI
            ? 'Bạn có chắc chắn muốn xóa chuyên khoa này?'
            : 'Are you sure you want to delete this specialty?';

        if (!window.confirm(confirmText)) {
            return;
        }

        try {
            let res = await deleteSpecialty({ id: specialtyId });
            if (res && res.errCode === 0) {
                toast.success("Xóa chuyên khoa thành công!");
                await this.loadSpecialties();
            } else {
                toast.error("Xóa chuyên khoa thất bại!");
            }
        } catch (error) {
            console.error('Error deleting specialty:', error);
            toast.error('Xóa chuyên khoa thất bại!');
        }
    }

    handleSearchChange = (event) => {
        this.setState({ searchKeyword: event.target.value });
    }

    getFilteredSpecialties = () => {
        let { specialties, searchKeyword } = this.state;
        if (!searchKeyword) return specialties;

        let keyword = searchKeyword.toLowerCase();
        return specialties.filter(s =>
            s.name && s.name.toLowerCase().includes(keyword)
        );
    }

    render() {
        let { editingId, isLoading, searchKeyword } = this.state;
        let { language } = this.props;
        let filteredSpecialties = this.getFilteredSpecialties();

        return (
            <div className='manage-specialty-container container-fluid'>
                {/* Form Card */}
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-body p-4">
                        {/* Header */}
                        <div className="row align-items-center mb-4">
                            <div className="col-md-6">
                                <h4 className="text-admin font-weight-bold mb-0">
                                    <i className="fa-solid fa-stethoscope me-2"></i>
                                    {language === LANGUAGES.VI ? 'Quản lý chuyên khoa' : 'Manage Specialties'}
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {language === LANGUAGES.VI ? 'Tạo mới, chỉnh sửa và quản lý các chuyên khoa khám bệnh' : 'Create, edit and manage clinic specialties'}
                                </p>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className='row g-3 border-top pt-4'>
                            <div className='col-12 mb-2 fw-bold text-dark fs-6'>
                                <i className={`fa-solid ${editingId ? 'fa-edit' : 'fa-plus-circle'} me-2 text-admin`}></i>
                                {editingId
                                    ? (language === LANGUAGES.VI ? 'Chỉnh sửa chuyên khoa' : 'Edit Specialty')
                                    : (language === LANGUAGES.VI ? 'Thêm mới chuyên khoa' : 'Add New Specialty')
                                }
                            </div>

                            <div className='col-md-6'>
                                <label className="form-label fw-bold small text-secondary mb-2">{language === LANGUAGES.VI ? 'Tên chuyên khoa' : 'Specialty Name'}</label>
                                <input className='form-control'
                                    type='text'
                                    value={this.state.name}
                                    onChange={(event) => this.handleOnChangeInput(event, 'name')}
                                    placeholder={language === LANGUAGES.VI ? 'Nhập tên chuyên khoa...' : 'Enter specialty name...'}
                                />
                            </div>

                            <div className='col-md-6'>
                                <label className="form-label fw-bold small text-secondary mb-2">{language === LANGUAGES.VI ? 'Ảnh chuyên khoa' : 'Specialty Image'}</label>
                                <div className='preview-img-container d-flex align-items-center gap-3'>
                                    <input id="previewImg" type='file' hidden
                                        onChange={(event) => this.handleOnChangeImage(event)}
                                    />
                                    <label className='btn btn-outline-admin btn-sm rounded-pill px-3 mb-0' htmlFor='previewImg'>
                                        {language === LANGUAGES.VI ? 'Tải ảnh' : 'Upload Image'} <i className="fa-solid fa-upload ms-1"></i>
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
                                <label className="form-label fw-bold small text-secondary mb-2">{language === LANGUAGES.VI ? 'Mô tả chi tiết' : 'Detailed Description'}</label>
                                <div className="border rounded-3 overflow-hidden">
                                    <MdEditor
                                        style={{ height: '300px' }}
                                        renderHTML={text => mdParser.render(text)}
                                        onChange={this.handleEditorChange}
                                        value={this.state.descriptionMarkdown}
                                        placeholder={language === LANGUAGES.VI ? 'Nhập mô tả về chuyên khoa...' : 'Enter specialty description...'}
                                    />
                                </div>
                            </div>

                            <div className='col-12 mt-4'>
                                <div className='d-flex gap-2 justify-content-end'>
                                    {editingId && (
                                        <button className='btn btn-sm btn-outline-secondary rounded-pill px-4' onClick={this.resetForm}>
                                            <i className="fa-solid fa-times me-1"></i> {language === LANGUAGES.VI ? 'Hủy' : 'Cancel'}
                                        </button>
                                    )}
                                    <button className={`btn btn-sm rounded-pill px-4 ${editingId ? 'btn-warning text-white' : 'btn-admin'}`}
                                        onClick={() => this.handleSaveNewSpecialty()}
                                    >
                                        <i className={`fa-solid ${editingId ? 'fa-save' : 'fa-plus'} me-1`}></i>
                                        {editingId
                                            ? (language === LANGUAGES.VI ? 'Lưu thay đổi' : 'Save Changes')
                                            : (language === LANGUAGES.VI ? 'Thêm mới' : 'Create New')
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Specialties List Card */}
                <div className="card shadow-sm border-0 rounded-3">
                    <div className="card-body p-4">
                        <div className="row align-items-center mb-4">
                            <div className="col-md-6">
                                <h4 className="text-admin font-weight-bold mb-0">
                                    <i className="fa-solid fa-list me-2"></i>
                                    {language === LANGUAGES.VI ? 'Danh sách chuyên khoa' : 'Specialties List'}
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {language === LANGUAGES.VI ? `Tổng số: ${filteredSpecialties.length} chuyên khoa` : `Total: ${filteredSpecialties.length} specialties`}
                                </p>
                            </div>
                            <div className="col-md-6 d-flex justify-content-md-end mt-3 mt-md-0">
                                <div className="input-group" style={{ maxWidth: '300px' }}>
                                    <span className="input-group-text bg-white border-end-0"><i className="fas fa-search text-muted"></i></span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 ps-0"
                                        placeholder={language === LANGUAGES.VI ? 'Tìm kiếm chuyên khoa...' : 'Search specialties...'}
                                        value={searchKeyword}
                                        onChange={this.handleSearchChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className='text-center py-5 text-secondary'>
                                <i className="fa-solid fa-spinner fa-spin fa-2x mb-3 text-admin"></i>
                                <div>{language === LANGUAGES.VI ? 'Đang tải...' : 'Loading...'}</div>
                            </div>
                        ) : filteredSpecialties.length === 0 ? (
                            <div className='text-center py-5 text-secondary border rounded-3 bg-light'>
                                <i className="fa-solid fa-folder-open fa-2x mb-3 text-muted"></i>
                                <p className="mb-0">{language === LANGUAGES.VI ? 'Không có chuyên khoa nào' : 'No specialties found'}</p>
                            </div>
                        ) : (
                            <div className='table-responsive'>
                                <table className='table table-hover align-middle'>
                                    <thead className="table-light text-secondary">
                                        <tr>
                                            <th style={{ width: '80px' }}>{language === LANGUAGES.VI ? 'STT' : 'No.'}</th>
                                            <th>{language === LANGUAGES.VI ? 'Tên chuyên khoa' : 'Specialty Name'}</th>
                                            <th style={{ width: '120px' }}>{language === LANGUAGES.VI ? 'Hình ảnh' : 'Image'}</th>
                                            <th>{language === LANGUAGES.VI ? 'Mô tả' : 'Description'}</th>
                                            <th style={{ width: '180px' }}>{language === LANGUAGES.VI ? 'Ngày tạo' : 'Created Date'}</th>
                                            <th className="text-center" style={{ width: '120px' }}>{language === LANGUAGES.VI ? 'Thao tác' : 'Actions'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSpecialties.map((specialty, index) => (
                                            <tr key={specialty.id}>
                                                <td>{index + 1}</td>
                                                <td className='fw-bold text-dark'>{specialty.name}</td>
                                                <td>
                                                    {specialty.image ? (
                                                        <img
                                                            src={specialty.image}
                                                            alt={specialty.name}
                                                            className='rounded shadow-sm'
                                                            style={{ width: '60px', height: '40px', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <span className='text-muted small italic'>No image</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="text-truncate" style={{ maxWidth: '300px' }} title={specialty.descriptionMarkdown}>
                                                        {specialty.descriptionMarkdown || '—'}
                                                    </div>
                                                </td>
                                                <td>
                                                    {specialty.createdAt
                                                        ? moment(specialty.createdAt).format('DD/MM/YYYY HH:mm')
                                                        : '—'
                                                    }
                                                </td>
                                                <td className="text-center">
                                                    <div className='d-flex gap-2 justify-content-center'>
                                                        <button
                                                            className='btn btn-sm btn-outline-admin px-2 rounded-pill'
                                                            onClick={() => this.handleEditSpecialty(specialty)}
                                                            title={language === LANGUAGES.VI ? 'Sửa' : 'Edit'}
                                                        >
                                                            <i className="fa-solid fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className='btn btn-sm btn-outline-danger px-2 rounded-pill'
                                                            onClick={() => this.handleDeleteSpecialty(specialty.id)}
                                                            title={language === LANGUAGES.VI ? 'Xóa' : 'Delete'}
                                                        >
                                                            <i className="fa-solid fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
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

export default connect(mapStateToProps, mapDispatchToProps)(ManageSpecialty);
