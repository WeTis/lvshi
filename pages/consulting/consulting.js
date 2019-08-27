// pages/consulting/consulting.js
import { config } from '../../utils/config.js';
import { consulting } from './module.js';
const http = new consulting();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    picker: ['房屋买卖', '房租租赁','婚姻','继承','合同','劳动合同','知识产权','债权','交通肇事'],
    index: '',
    region:[],
    showModule: false,
    lawyer: {},
    imgList: [],
    uploadUrl: [],
    userName: null,
    content: null,               //咨询内容
    type: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let info = JSON.parse(options.lawyer);
    this.setData({
      lawyer: info,
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },
  showModuleFn(){
   this.setData({
     showModule: true
   })
  },
  /**
   * 获取用户姓名
   */
  getUserName(e){
    this.setData({
      userName: e.detail.value
    })
  },
  /**
   * 获取咨询类型
   */
  PickerChange(e){
    console.log(e);
    this.setData({
      index: e.detail.value
    })
  },
  /**
   * 获取地址
   */
  getuserAddress(e) {
    let data = e.detail.value;
    this.setData({
      region: data,
      // userAddress: data.join()
    })
  },
  /**
   * 获取咨询内容
   */
  getcontent(e){
    this.setData({
      content: e.detail.value
    })
  },
  /**
  * 上传图片
  */
  ChooseImage() {
    wx.chooseImage({
      sizeType: ['original', 'compressed'], //可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album'], //从相册选择
      success: (res) => {
        let arr = [];
        for (let i = 0; i < res.tempFilePaths.length; i++) {
          let url = res.tempFilePaths[i];
          arr.push({
            status: 0,
            url: url
          })
        }
        if (this.data.imgList.length != 0) {
          this.setData({
            imgList: this.data.imgList.concat(arr)
          })
        } else {
          this.setData({
            imgList: arr
          })
        }
      }
    });
  },
  ViewImage(e) {
    wx.previewImage({
      urls: this.data.imgList,
      current: e.currentTarget.dataset.url
    });
  },
  DelImg(e) {
    wx.showModal({
      title: '提示',
      content: '确定要删除此照片？',
      cancelText: '取消',
      confirmText: '确定',
      success: res => {
        if (res.confirm) {
          this.data.imgList.splice(e.currentTarget.dataset.index, 1);
          this.setData({
            imgList: this.data.imgList
          })
        }
      }
    })
  },
  /**
   * 上传图片到服务器
   */
  uploadImgHttp(fn) {
    let _that = this;
    wx.showLoading({
      title: '正在上传',
      mask: true
    })
    let arr = [];
    for (let i = 0; i < _that.data.imgList.length; i++){
      wx.uploadFile({
        url: config.api_base_url + '/user/uploadOss', // 仅为示例，非真实的接口地址
        filePath: _that.data.imgList[i].url,
        name: 'file',
        success(res) {
          const data = JSON.parse(res.data)
          let url = _that.data.uploadUrl;
          url.push(data.url);
          _that.data.imgList[i].status = 1;
          _that.setData({
            uploadUrl: url
          })
          // wx.hideLoading();
          fn && fn();
        },
        fail(err) {
          _that.data.imgList[i].status = 2;
        }
      });

    }


    
  },
  /**
   * 提交
   */
  submit(){
    // this.isValue();

    // 判断是否需要上传图片
    let timer = null;
    let that = this;
    if (this.data.imgList.length > 0){
      this.uploadImgHttp();
      let imgList = this.data.imgList;
      timer = setInterval(() => {
        let status = true;
        let err = false;
        let arr = [];
        for (let i = 0; i < imgList.length; i++){
          if (imgList[i].status == 0 )
          {
            status = false;
            break;
          }

          if(imgList[i].status == 2){
            // 失败
            arr.push(imgList[i]);
            err = true;
          }
        }
        if(status && err){
          // 执行完成并且有上传失败的文件
          wx.hideLoading();
          clearInterval(timer);
          that.setData({
            imgList: arr
          })
          wx.showModal({
            title: '提示',
            content: '部分图片上传失败，是否重新上传失败图片？',
            cancelText: '直接提交',
            confirmText: '重新上传',
            success: res => {
              if (res.confirm) {
                that.submit();
              }else{
                // 提交数据
                that.submitFn();
              }
            }
          })
        }
        if(status){
          clearInterval(timer);
          // 提交数据
          wx.hideLoading();
          that.submitFn();
        }
      },300)
    }else{
      // 不上传
      let data = {
        money: 0.1,
        adviceType: this.data.picker[this.data.index],
        lawyerId: this.data.lawyer.id,
        type: this.data.type,
        address: this.data.region.join(),
        content: this.data.content
      }
    }
  },
  /**
   * 提交数据
   */
  submitFn(){
    wx.showLoading({
      title: '正在提交数据',
    })
    let data = {
      money: 1000,
      adviceType: this.data.picker[this.data.index],
      lawyerId: this.data.lawyer.id,
      type: this.data.type,
      address: this.data.region.join(),
      content: this.data.content,
      image: this.data.uploadUrl.join()
    }

    http.createOrder(data)
    .then(res => {
      console.log(res);
      wx.hideLoading();
      wx.showToast({
        title: '提交成功',
      })
      wx.requestPayment({
        'timeStamp': timeStamp.toString(),
        'nonceStr': data.nonceStr,
        'package': data.package,
        'signType': 'MD5',
        'paySign': data.paySign,
        success: function (res) {
          let courseIdList = _that.data.courseIdList;
          courseIdList.push(id)
          _that.setData({
            courseIdList: courseIdList
          })
          wx.setStorage({
            key: 'courseIdList',
            data: courseIdList
          })
          wx.showToast({
            title: '支付成功，点击观看',
            icon: 'success',
            duration: 2000
          })
        },
        fail: function (err) {
          wx.showToast({
            title: '支付失败，无法观看次视频',
            icon: 'none',
            duration: 2000
          })
        }
      });
    })
  },
  /**
   * 检查
   */
  isValue(){
    if (!this.data.userName){
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      })
      return false;
    }

    if (!this.data.index) {
      wx.showToast({
        title: '请选择咨询类型',
        icon: 'none'
      })
      return false;
    }
    
    if (this.data.region.length <= 0) {
      wx.showToast({
        title: '请选择所在地',
        icon: 'none'
      })
      return false;
    }

    if (!this.data.content && !this.data.showModule) {
      wx.showToast({
        title: '请输入问题描述',
        icon: 'none'
      })
      return false;
    }
  }
})