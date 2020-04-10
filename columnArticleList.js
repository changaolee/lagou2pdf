// 获取专栏文章列表
const config = require('./config.js');
const superagent = require('superagent');
const utils = require('./utils');
const path = require('path');
const generaterPdf = require('./generaterPdf.js');

/**
 * 执行方法
 */
(async function getColumnArticleList(firstArticalId, lastArticalId) {
    await utils.createDir('lagou_' + config.columnName);
    console.log('专栏文章链接开始获取');
    let columnArticleUrlList = [];
    let articalId = firstArticalId;

    async function getNextColumnArticleUrl() {
        try {
            let url = config.url + "?lessonId=" + articalId;
            let res = await superagent.get(url)
                .set({
                    'Connection': 'keep-alive',
                    'Accept': 'application/json, text/plain, */*',
                    'Sec-Fetch-Dest': 'empty',
                    'X-L-REQ-HEADER': '{deviceType:1}',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
                    'Origin': 'https://kaiwu.lagou.com',
                    'Sec-Fetch-Site': 'same-site',
                    'Sec-Fetch-Mode': 'cors',
                    'Referer': 'https://kaiwu.lagou.com/course/courseInfo.htm?courseId=46',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,und;q=0.7,zh-TW;q=0.6',
                    'Cookie': config.cookie,
                });
            if (res.body && res.body.error && res.body.error.code) {
                console.log('error msg', res.body.error.msg);
                throw new Error(res.body.error.msg);
            }
            console.log(res.body.content.theme);
            let columnArticle = res.body.content;

            let articleInfo = {
                articleTitle: columnArticle.theme, // 文章标题
                articleContent: columnArticle.textContent, // 文章内容
                teacherName: columnArticle.teacherDTOList[0].teacherName, // 文章作者
                publishDate: columnArticle.publishDate  // 文章创建时间
            };
            columnArticleUrlList.push(articleInfo);
            // 替换文章名称的 / 线， 解决路径被分割的问题
            let useArticleTtle = columnArticle.theme.replace(/\//g, '-');
            //生成PDF 
            await generaterPdf(articleInfo,
                useArticleTtle + '.pdf',
                path.resolve(__dirname, 'lagou_' + config.columnName)
            );
            // 判断是否还有下一篇文章
            if (articalId < lastArticalId) {
                articalId += 1;
                await utils.sleep(1.5);
                await getNextColumnArticleUrl();
            }

        } catch (err) {
            console.log(`访问地址 err`, err.message);
        }
    }

    await getNextColumnArticleUrl(firstArticalId);
    console.log('专栏文章链接获取完成');
    utils.writeToFile(`lagou_${config.columnName}`, JSON.stringify(columnArticleUrlList, null, 4));
    return columnArticleUrlList;
})(config.firstArticalId, config.lastArticalId);