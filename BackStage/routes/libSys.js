let express = require('express');
let informationDB = require('../models/information_db');
let router = express.Router();
let bodyParser = require('body-parser');
let urlencodedParser = bodyParser.urlencoded({ extended: false });
var ObjectID = require('mongodb').ObjectID;

// 跨域header设定
router.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1')
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});



/*
 * @function 还书
 * @param
 * @return code(int) , msg(string)
 */
router.post('/book/return',urlencodedParser,function(req,res,next){
	BookCollection=informationDB.getCollection('books');
	UserCollection=informationDB.getCollection('user');

	BorrowCollection.findOne({'bookID' : ObjectID(req.body.bookID)},function(err,borrowingData){
		if(!borrowingData) {res.status(200).json({ 'code' : -1 , 'msg' : '错误'}); return;}
		else
		{
		BorrowCollection.updateOne({bookID : req.body.bookID},
			{'$set' : {
				'place' : req.body.place,
				'returnTime' : JSON.parse(req.body.time)
			} });
		res.status(200).json({'code' : 1, 'msg' : '预约归还成功'});
		}
	});
})

/*
 * @function 删除图书（管理员权限）
 * @param
 * @return code(int) , msg(string)
 */
router.get('/admin/deleteBook',urlencodedParser,function(req,res,next){

	BookCollection=informationDB.getCollection('books');

	BookCollection.deleteOne({bookID : req.body.bookID},function(err,next){
		if(!'_id') 
		res.status(200).json({'code' : 1, 'msg' : "删除成功"});
		else
         {
			res.status(200).json({
				'code' : -1,
				'msg' : "删除失败（没有这本书）"
			})
		}
	})
})

/*
 * @function 查看书籍情况总览
 * @param _id(string)书籍id，bookName(string)书名，tag(string)书籍标签，author(string)作者， 
 * status(bool)书籍是否可借阅，location(string)书籍地点
 * @return code(int) , msg(string)
 */
router.get('/checkAllBook',urlencodedParser,function(req,res,next){
		let checkCondition={}
		let cache
		//console.log(req.body.borrowTime);
		if(cache=req.body.bookID) checkCondition.bookID=JSON.parse(cache);//如果前端给的不是JSON是字符串，则需要转换
		if(cache=req.body.bookName) checkCondition.bookName=cache;//同上
		if(cache=req.body.tag) checkCondition.tag=cache;
		if(cache=req.body.author) checkCondition.author=cache;
		if(cache=req.body.status) checkCondition.status=cache; 
		if(cache=req.body.location) checkCondition.location=cache;
		if(cache=req.body.publish) checkCondition.publish=cache;
		if(!cache)  checkCondition={}
		//console.log(checkCondition);
	
	
		BookCollection=informationDB.getCollection('books');
	
		result=BookCollection.find(checkCondition).toArray(function(err,allData){
			res.status(200).json({
				data : allData
			})
		})
	});


/*
 * @function 查询单本图书信息
 * @param _id(string) 图书id
 * @return code(int)状态码,msg(string)提示信息,data(json)详细数据
 */
router.get('/admin/checkSingleBook', urlencodedParser, function (req, res, next) {


	let bookCollection = informationDB.getCollection("books");
	bookCollection.findOne({bookID: req.body.bookID}, function (err, getData) {
		if(getData){
			res.status(200).json({
				code: 1,
				msg:  "查询成功",
				data: getData
			})
		}
		else{
			res.status(200).json({
				code: -1,
				msg:  "这本书不存在",
				data: {}
			})
		}

	});

});



/*
 * @function 点赞图书
 * @param _id(string) 图书id
 * @return code(int)状态码,msg(string)提示信息
 */
router.post("/book/like",urlencodedParser,function(req,res,next){
	var likeBody = {
		_id:         ObjectID(req.body._id),
		liker		: req.body.liker
	};


	bookCollection=informationDB.getCollection("books");
	bookCollection.findOne({bookID : req.body.bookID },function(err, findRes){
		if(!findRes || err)
		{
			res.status(200).json({
				code: -1,
				msg	: "fail"
			});
			return;
		}
		console.log(findRes);
		var like = findRes.like;
		like.push(likeBody.uid);
		bookCollection.updateOne({_id : likeBody._id},{$set : {like : likelist}},function(err,updateRes){
			if(err)
			{
				res.status(200).json({
					code: -1,
					msg	: "fail"
				});
				return;
			}
			res.status(200).json({
				code: 1,
				msg	: "success"
			});
			return;
		})
	})
});

/*
 * @function 借书
 * @param
 * @return code(int) , msg(string)
 */
router.post('/book/borrow',urlencodedParser,function(req,res,next){
	//假设前端已完成登录
	BookCollection=informationDB.getCollection('books');
	UserCollection=informationDB.getCollection('user');


	BookCollection.findOne({_id : req.body._id},function(err,next){
		if(err) console.log("ERROR:" + err);
		else{
			if(next.status==1) {res.status(200).json({ code : -1 , msg : "书籍已经借出"}); return;}
				else {
					UserCollection.findOne({uid : req.body.uid},function(err,userD){
						//console.log(userD);  //测试打开
						if(userD.borrowing.length>=1) res.status(200).json({code : -1, msg :"没有权限借书"});
						else{
							let nowDate= new Date();
								
							BookCollection.updateOne({'_id' : ObjectID(req.body._id)},
							{'$set' : {
								'status' : '1',
								'returnTime' : JSON.parse(req.body.time),
								'location':JSON.parse(req.body.loacation)
							} ,
							
								borrower : {
									uid : userD.uid
								},
								borrowTime : {
									year : nowDate.getFullYear(),
									month : nowDate.getMonth(),
									day : nowDate.getDay()
								},
								returnTime:{
									year : 0,
									month : 0,
									day : 0
								},
								location : "",
								continueTime : 0
							},function(err,insertD){
							
								
								//用户记录更新
								UserCollection.updateOne({uid : req.body.uid},
									{'$set' : {borrowing : Array(userD.history).push(insertD.ops[0]._id),
										'status':1
									}});
	
								res.status(200).json({
									"code" : 1,
									'msg' : '操作成功'
								})
							});
							

							
						}
					})
				}
		}
	});
});



/*@function 推荐图书
*/
router.post('/book/recommend',urlencodedParser,function(req,res,next){
	var userCollection = informationDB.getCollection("user");
	var postCollection = informationDB.getCollection("post");
	var now = new Date();
	var postData={
		title       : req.body.title,
		book        : req.body.book,
		content     : req.body.content,
		creator     : req.body.creator,
		like		: [],
		comments	: [],
		date		: { month : now.getMonth()+1 , day : now.getDay()+1 }
	};
	console.log(postData);
	postCollection.insertOne(postData);
	userCollection.findOne({ userName : postData.creator },function(err,postMan){
		if(err)
		{
			console.log("/book/recommend error!");
			res.status(200).json({
				code: -2,
				msg	: "error User!"
			});
			return;
		}
		// console.log(typeof postMan.post);
		arrData = postMan.post;
		// postMan.post.toArray(function(err,arrData){
			arrData.push(postData._id);
			userCollection.updateOne({userName : postData.creator},{$set : { post : arrData}},function(err,updateRes){
				if(err)
				{
					res.status(200).json({
						code	: -1,
						msg		: "sorry"
					});
					return;
				}
				else{
		
					res.status(200).json({
						code	: 1,
						msg		: "success"
					});
					return;
				}
			});
		// });
	

	});
});


/* @function 获取图书借用情况
   @parameter bookID(long)图书id，_id()用户id
*/
router.get('/book/checkCondition',urlencodedParser,function(req,res,next){

    let borrowData ={
		_id : req.body._id,
		bookID : req.body.bookID

	}

	BookCollection=informationDB.getCollection('books');
	accountCollection = informationDB.getCollection('user');
    
    bookCollection.findOne({bookID:borrowData.bookID},function(err,resData){
		if(!resData)
		{
			res.status(200).json({'code':-1,'msg':'没有这本书'});
		}
	

	else{
		if(resData.status==0){
			res.status(200).json({'code':1,'msg':'未借出'})
		}
		else {
	    accountCollection.findOne({_id : borrowData._id},function(err,getData){
		if(!getData) 
		res.status(200).json({'code' : -1, 'msg' : "没有这个用户"});
		else
         {
			if(getData.status==0)
			{
				res.status(200).json({'code':1,'msg':'别人借出'})
			}
			else{
				if(getData.history[-1]==borrowData.bookID){
					res.status(200).json({'code':1,'msg':'自己借出'})
				}
				else{
					res.status(200).json({'code':1,'msg':'别人借出'})
				}
			}
		}
	})
    }
    }
})

})

module.exports = router;

