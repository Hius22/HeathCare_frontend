import React, { Component } from 'react';
import { connect } from "react-redux";
import { FormattedMessage } from 'react-intl';
import './ManageSpecialty.scss';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import { CommonUtils, LANGUAGES } from '../../../utils';
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
            toast.error('Failed to load specialties');
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
            let base64 = await CommonUtils.getBase64(file);
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
            toast.error('Please enter specialty name');
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
                toast.success("Specialty updated successfully!");
                this.resetForm();
                await this.loadSpecialties();
            } else {
                toast.error("Failed to update specialty!");
            }
        } else {
            // Create new specialty
            res = await createNewSpecialty(this.state);
            if (res && res.errCode === 0) {
                toast.success("Specialty created successfully!");
                this.resetForm();
                await this.loadSpecialties();
            } else {
                toast.error("Failed to create specialty!");
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
                toast.success("Specialty deleted successfully!");
                await this.loadSpecialties();
            } else {
                toast.error("Failed to delete specialty!");
            }
        } catch (error) {
            console.error('Error deleting specialty:', error);
            toast.error('Failed to delete specialty');
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
            <div className='manage-specialty-container'>
                <div className='ms-header'>
                    <h2>
                        <i className="fa-solid fa-stethoscope"></i>
                        {language === LANGUAGES.VI ? 'Quản lý chuyên khoa' : 'Manage Specialties'}
                    </h2>
                </div>

                {/* Form Section */}
                <div className='form-section'>
                    <div className='form-title'>
                        <i className={`fa-solid ${editingId ? 'fa-edit' : 'fa-plus-circle'}`}></i>
                        {editingId
                            ? (language === LANGUAGES.VI ? 'Chỉnh sửa chuyên khoa' : 'Edit Specialty')
                            : (language === LANGUAGES.VI ? 'Thêm mới chuyên khoa' : 'Add New Specialty')
                        }
                    </div>

                    <div className='add-new-specialty row'>
                        <div className='col-6 form-group'>
                            <label>{language === LANGUAGES.VI ? 'Tên chuyên khoa' : 'Specialty Name'}</label>
                            <input className='form-control'
                                type='text'
                                value={this.state.name}
                                onChange={(event) => this.handleOnChangeInput(event, 'name')}
                                placeholder={language === LANGUAGES.VI ? 'Nhập tên chuyên khoa...' : 'Enter specialty name...'}
                            />
                        </div>

                        <div className='col-6 form-group'>
                            <label>{language === LANGUAGES.VI ? 'Ảnh chuyên khoa' : 'Specialty Image'}</label>
                            <div className='preview-img-container'>
                                <input id="previewImg" type='file' hidden
                                    onChange={(event) => this.handleOnChangeImage(event)}
                                />
                                <label className='label-upload' htmlFor='previewImg'>
                                    {language === LANGUAGES.VI ? 'Tải ảnh' : 'Upload Image'} <i className="fa-solid fa-upload"></i>
                                </label>

                                <div className='preview-image'
                                    style={{ backgroundImage: `url(${this.state.previewImgURL})` }}
                                    onClick={() => this.openPreviewImage()}
                                >
                                </div>
                            </div>
                        </div>


                        <div className='col-12'>
                            <label>{language === LANGUAGES.VI ? 'Mô tả chi tiết' : 'Detailed Description'}</label>
                            <MdEditor
                                style={{ height: '300px' }}
                                renderHTML={text => mdParser.render(text)}
                                onChange={this.handleEditorChange}
                                value={this.state.descriptionMarkdown}
                                placeholder={language === LANGUAGES.VI ? 'Nhập mô tả về chuyên khoa...' : 'Enter specialty description...'}
                            />
                        </div>
                        <div className='col-12'>
                            <div className='form-actions'>
                                {editingId && (
                                    <button className='btn btn-cancel' onClick={this.resetForm}>
                                        <i className="fa-solid fa-times"></i> {language === LANGUAGES.VI ? 'Hủy' : 'Cancel'}
                                    </button>
                                )}
                                <button className='btn btn-save'
                                    onClick={() => this.handleSaveNewSpecialty()}
                                >
                                    <i className={`fa-solid ${editingId ? 'fa-save' : 'fa-plus'}`}></i>
                                    {editingId
                                        ? (language === LANGUAGES.VI ? 'Lưu thay đổi' : 'Save Changes')
                                        : (language === LANGUAGES.VI ? 'Thêm mới' : 'Create New')
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Specialties List */}
                <div className='specialties-list-section'>
                    <div className='list-header'>
                        <h3>
                            <i className="fa-solid fa-list"></i>
                            {language === LANGUAGES.VI ? 'Danh sách chuyên khoa' : 'Specialties List'}
                        </h3>
                        <div className='search-box'>
                            <input
                                type="text"
                                className="form-control"
                                placeholder={language === LANGUAGES.VI ? 'Tìm kiếm chuyên khoa...' : 'Search specialties...'}
                                value={searchKeyword}
                                onChange={this.handleSearchChange}
                            />
                            <i className="fa-solid fa-search"></i>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className='loading'>
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <span>{language === LANGUAGES.VI ? 'Đang tải...' : 'Loading...'}</span>
                        </div>
                    ) : filteredSpecialties.length === 0 ? (
                        <div className='no-data'>
                            <i className="fa-solid fa-folder-open"></i>
                            <p>{language === LANGUAGES.VI ? 'Không có chuyên khoa nào' : 'No specialties found'}</p>
                        </div>
                    ) : (
                        <div className='specialties-table-container'>
                            <table className='specialties-table'>
                                <thead>
                                    <tr>
                                        <th>{language === LANGUAGES.VI ? 'STT' : 'No.'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Tên chuyên khoa' : 'Specialty Name'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Hình ảnh' : 'Image'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Mô tả' : 'Description'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Ngày tạo' : 'Created Date'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Thao tác' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSpecialties.map((specialty, index) => (
                                        <tr key={specialty.id}>
                                            <td>{index + 1}</td>
                                            <td className='specialty-name'>{specialty.name}</td>
                                            <td>
                                                {specialty.image ? (
                                                    <img
                                                        src={specialty.image}
                                                        alt={specialty.name}
                                                        className='specialty-thumb'
                                                    />
                                                ) : (
                                                    <span className='no-image'>No image</span>
                                                )}
                                            </td>
                                            <td className='description-cell'>
                                                {specialty.descriptionMarkdown
                                                    ? specialty.descriptionMarkdown.substring(0, 100) + '...'
                                                    : '—'
                                                }
                                            </td>
                                            <td>
                                                {specialty.createdAt
                                                    ? moment(specialty.createdAt).format('DD/MM/YYYY HH:mm')
                                                    : '—'
                                                }
                                            </td>
                                            <td>
                                                <div className='action-buttons'>
                                                    <button
                                                        className='btn btn-edit'
                                                        onClick={() => this.handleEditSpecialty(specialty)}
                                                    >
                                                        <i className="fa-solid fa-edit"></i>
                                                        {language === LANGUAGES.VI ? 'Sửa' : 'Edit'}
                                                    </button>
                                                    <button
                                                        className='btn btn-delete'
                                                        onClick={() => this.handleDeleteSpecialty(specialty.id)}
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                        {language === LANGUAGES.VI ? 'Xóa' : 'Delete'}
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
