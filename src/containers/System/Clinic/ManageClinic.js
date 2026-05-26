import React, { Component } from 'react';
import { connect } from "react-redux";
import { FormattedMessage } from 'react-intl';
import './ManageClinic.scss';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import { CommonUtils } from '../../../utils';
import 'react-image-lightbox/style.css';
import Lightbox from 'react-image-lightbox';
import { getClinicInfo, updateClinicInfo, createClinicInfo } from '../../../services/userService';
import { toast } from 'react-toastify';

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
        }
    }

    async componentDidMount() {
        let res = await getClinicInfo();
        if (res && res.errCode === 0 && res.data) {
            // Clinic exists - load data for editing
            let data = res.data;
            this.setState({
                id: data.id,
                name: data.name || '',
                address: data.address || '',
                descriptionHTML: data.descriptionHTML || '',
                descriptionMarkdown: data.descriptionMarkdown || '',
                previewImgURL: data.image || '',
                isEditMode: true, // Enable update mode
            })
            console.log('Loaded clinic data for update:', data);
        } else {
            // No clinic exists - enable create mode
            this.setState({
                isEditMode: false
            });
            toast.info("Chưa có phòng khám. Vui lòng tạo phòng khám mới.");
            console.log('No clinic found - create mode enabled');
        }
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

    handleSaveClinic = async () => {
        if (this.state.isEditMode) {
            // UPDATE existing clinic
            if (!this.state.id) {
                toast.error("Không tìm thấy phòng khám để cập nhật!");
                return;
            }

            let updateData = {
                ...this.state
            };

            console.log('Updating clinic with data: ', updateData);

            let res = await updateClinicInfo(updateData)
            if (res && res.errCode === 0) {
                toast.success("Cập nhật phòng khám thành công!");
            } else {
                toast.error(res.errMessage || "Cập nhật phòng khám thất bại!");
                console.log("Update failed: ", res)
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

            console.log('Creating new clinic with data: ', createData);

            let res = await createClinicInfo(createData)
            if (res && res.errCode === 0) {
                toast.success("Tạo phòng khám thành công!");
                // Reload the page to switch to edit mode
                window.location.reload();
            } else {
                toast.error(res.errMessage || "Tạo phòng khám thất bại!");
                console.log("Create failed: ", res)
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
                            <input className='form-control'
                                type='text'
                                placeholder='Nhập địa chỉ phòng khám...'
                                value={this.state.address}
                                onChange={(event) => this.handleOnChangeInput(event, 'address')}
                            />
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

                        <div className='col-12'>
                            <button className='btn-save-clinic'
                                onClick={() => this.handleSaveClinic()}
                            >
                                <i className={`fas ${this.state.isEditMode ? 'fa-save' : 'fa-plus-circle'}`}></i>
                                {this.state.isEditMode ? ' Cập Nhật Thông Tin' : ' Tạo Phòng Khám'}
                            </button>
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
