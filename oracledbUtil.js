/**
 * Oracle数据库操作通用API：增、删、改、查的操作封装：统一一个execute和query方法，对应所有的SQL。
 * 封装一个SQL执行结果对象ResultData
 *      status：1,true;0 false
 *      data：操作结果集
 *      number：操作结果总条数
 *      message：错误或者成功消息
 * @param args
 * @constructor
 */
var OracleDbUtil = function () {

    /**
     *   数据库执行操作：外界提供回调函数，用于对查询结果进行处理
     *   1、数据库连接的execute操作是一个异步请求，需要一个回掉函数
     *   2、如果等待异步完成，则需要使用await后则可调用回调函数
     *   3、外部调用者提供对数据的处理函数，然后在该数据库操作函数中调用回调函数。
     */
     this.oracleExecuteByCallback = async function (oracledb, sql,params,dbCallback) {
         //回调函数参数封装对象
        var resultData = {
            status:0 //默认为失败状态
        };

        let connection;
        try {
            // Get a connection from the default pool
            connection = await oracledb.getConnection();

            //execute返回的是一个Promise对象
            let results = await connection.execute(sql, params);

            //成功：则记录操作结果
            resultData.status = 1;
            resultData.message = "操作成功";
            resultData.data = results;
            resultData.number = results.length;
        } catch (err) {
            //失败：记录失败信息
            resultData.message = "连接数据库失败";
            console.error(err);
        } finally {
            //关闭连接池
            if (connection) {
                try {
                    // Put the connection back in the pool
                    await connection.close();
                } catch (err) {
                    console.error(err);
                }
            }

            //统一执行回调
            dbCallback(resultData);
        }
    };

    /**
     *   数据库执行操作：异步返回方式
     *   1、数据库连接的execute操作是一个异步请求，需要一个回调函数。
     *   2、封装一个Promise对象，在getConnection的回调中处理查询结果，封装resolve返回对象。
     *   3、外部调用者完成后续对resolve的对象的处理。
     */
    this.oracleExecuteByPromise =  function (db, sql,params) {
        return new Promise(async (resolve, reject) => {
            try{
                //数据库连接获取操作，需要传入一个回调函数，处理创建的连接。
                db.getConnection(function(err, connection) {
                    if(err) {
                        console.error(err);
                        reject({
                            status: 0,
                            message: '连接数据库失败'
                        });
                        return;
                    }

                    //数据库SQL执行操作，需要传入一个回调函数，处理执行结果。
                    let _query = connection.execute(sql, params, function(err, results) {
                        if(err) {
                            console.error(err);
                            reject({
                                status: 0,
                                message:'操作失败'
                            });
                            return;
                        }

                        //释放连接
                        connection.release();

                        //返回操作执行成功的结果
                        resolve({
                            status: 1,
                            data: results,
                            number: results.length,
                            message:'操作成功'
                        });
                    })
                })
            }catch(err){
                console.error(err);
                reject({
                    status: 0,
                    message:'操作异常'
                });
            }
        });
    }

    /**
     * 回调函数直接处理方式
     * @param db      连接池对象
     * @param sql     待执行SQL
     * @param params  SQL参数
     * @param dbCallback 操作结果的回调函数
     */
     this.mysqlExecuteByCallback = function (db, sql,params,dbCallback) {
         //返回结果
        var resultData = {
            status:0 //默认为失败状态
        };

         try{
             //获取连接
             db.getConnection(function (err, connection) {
                 if (err) {
                     //失败：记录失败信息
                     resultData.message = "连接数据库失败";
                     console.error(err);
                     dbCallback(resultData);
                     return;
                 }

                 console.log("connection ok");

                 //results是一个数组，每个元素是一个JSON对象，值为表得各个字段的值。
                 let _query = connection.query(sql, params, function (err, results) {
                     if (err) {
                         //失败：记录失败信息
                         resultData.message = err;
                         console.log("query error:"+err);
                         dbCallback(resultData);
                         return;
                     }

                     connection.release();

                     //成功：则记录操作结果
                     resultData.status = 1;
                     resultData.message = "操作成功";
                     resultData.data = results;
                     resultData.number = results.length;
                     console.log(resultData.results);
                     dbCallback(resultData);
                 })
             })
         }catch(err){
             resultData.message = err;
             console.error(err);
             dbCallback(resultData);
         }
    };

    /**
     * Promise返回操作结果方式
     * @param db      数据库连接池对象
     * @param sql     SQL语句
     * @param params  SQL参数
     * @returns {Promise} 成功，则包裹查询结果；失败则包裹状态信息
     */
     this.mysqlExecuteByPromise =  function (db, sql,params) {
         return new Promise(async (resolve, reject) => {
             try{
                 db.getConnection(function(err, connection) {
                     if(err) {
                         console.error(err);
                         reject({
                             status: 0,
                             message: '连接数据库失败'
                         });
                         return;
                     }

                     let _query = connection.query(sql, params, function(err, results) {
                         console.log("_query :"+_query);

                         if(err) {
                             console.error(err);
                             reject({
                                 status: 0,
                                 message:'操作失败'
                             });
                             return;
                         }

                         connection.release();
                         resolve({
                             status: 1,
                             data: results,
                             number: results.length,
                             message:'操作成功'
                         });
                     })
                 })
             }catch(err){
                 console.error(err);
                 reject({
                     status: 0,
                     message:'操作异常'
                 });
             }
         });
     }
}

//导出一个模块对象：提供数据库的增、删、改、查功能
module.exports = new OracleDbUtil();
