import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import Lightbox from 'react-image-lightbox';
import { toast } from 'react-toastify';

import { StoreContext } from 'store/Store';

import { counter, declOfNum, dateFormat, deletedUser } from 'support/Utils';
import { BACKEND, Strings, imageTypes, videoTypes } from 'support/Constants';

import Markdown from 'components/Markdown';
import UserRole from 'components/UserRole';
import VideoLightbox from 'components/VideoLightbox';

import Dropdown from './Dropdown';

export const CardBody = ({ children }) => {
  return (
    <div className="card_item">
      <div className="card_body">
        <div className="card_block">
          {children}
        </div>
      </div>
    </div>
  )
}

export const Card = ({ data, threadData, full = false, preview = false, type }) => {
  const { user, token, setModalOpen, setPostType, setFabVisible, lang } = useContext(StoreContext)
  const history = useHistory()
  const likesList = useRef()
  const [likes, setLikes] = useState(data.likes)
  const [liked, setLiked] = useState(user ? !!data?.likes?.find(i => i._id === user.id) : false)
  const [image, setImage] = useState('')
  const [imageOpen, setImageOpen] = useState(false)
  const [video, setVideo] = useState('')
  const [videoOpen, setVideoOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(preview ? true : false)
  const regexp = /(?:\.([^.]+))?$/

  if (data.author === null) {
    data.author = deletedUser
  }
  if (threadData && threadData.author === null) {
    threadData.author = deletedUser
  }

  useEffect(() => {
    if (type === 'thread' && data.closed) {
      setFabVisible(false)
    }
    if (type === 'thread' && !data.closed) {
      setFabVisible(true)
    }
    // eslint-disable-next-line
  }, [data.closed])

  const likeThread = () => {
    fetch(BACKEND + '/api/thread/like', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ threadId: data._id })
    })
      .then(response => response.json())
      .then(data => {
        if (!data.error) {
          setLikes(data.likes)
        } else throw Error(data.error?.message || 'Error')
      })
      .catch(err => toast.error(err.message))
  }

  const likeAnswer = () => {
    fetch(BACKEND + '/api/answer/like', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answerId: data._id })
    })
      .then(response => response.json())
      .then(data => {
        if (!data.error) {
          setLikes(data.likes)
        } else throw Error(data.error?.message || 'Error')
      })
      .catch(err => toast.error(err.message))
  }

  useEffect(() => {
    setLikes(data.likes)
  }, [data.likes])

  const onLike = ({ target }) => {
    if (likesList.current?.contains(target)) return

    if (user) {
      setLiked(prev => !prev)
      type === 'answer' ? likeAnswer() : likeThread()
    } else {
      history.push('/signup')
    }
  }

  const editClick = () => {
    const moder = user.role >= 2 ? true : false
    let postType
    if (type === 'thread' && moder) {
      postType = 'adminThreadEdit'
    } else if (type === 'answer') {
      postType = 'answerEdit'
    } else {
      postType = 'userThreadEdit'
    }
    setPostType({
      type: postType,
      id: data._id,
      someData: {
        id: data._id,
        title: data.title,
        body: data.body
      }
    })
    setModalOpen(true)
  }

  const reportClick = () => {
    const id = type === 'answer' ? data.threadId : data._id

    fetch(BACKEND + '/api/report/create', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        threadId: id,
        postId: data._id,
        body: data.body
      })
    })
      .then(response => response.json())
      .then(data => {
        if (!data.error) {
          toast.success(Strings.reportSent[lang])
        } else throw Error(data.error?.message || 'Error')
      })
      .catch(err => toast.error(err.message))
  }

  const answerTo = (toId, displayName) => {
    const id = type === 'answer' ? data.threadId : data._id

    setPostType({
      type: 'answer',
      id,
      someData: {
        toId,
        body: `**${displayName}**, `
      }
    })
    setModalOpen(true)
  }

  const deleteThread = () => {
    fetch(BACKEND + '/api/thread/delete', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ threadId: data._id })
    })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          toast.success(data.message)
          history.push('/')
        } else throw Error(data.error?.message || 'Error')
      })
      .catch(err => toast.error(err.message))
  }

  const deleteAnswer = () => {
    fetch(BACKEND + '/api/answer/delete', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answerId: data._id })
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) throw Error(data.error?.message || 'Error')
      })
      .catch(err => toast.error(err.message))
  }

  const onDelete = () => {
    if (type === 'answer') {
      deleteAnswer()
    } else {
      deleteThread()
    }
  }

  const onPin = () => {
    if (type !== 'answer') {
      const formData = new FormData()
      formData.append('postData', JSON.stringify({
        threadId: data._id,
        title: data.title,
        body: data.body,
        pined: !data.pined
      }))

      fetch(BACKEND + '/api/thread/adminedit', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token
        },
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) throw Error(data.error?.message || 'Error')
        })
        .catch(err => toast.error(err.message))
    }
  }

  const onClose = () => {
    if (type !== 'answer') {
      const editApi = user.role >= 2 ? 'adminedit' : 'edit'

      const formData = new FormData()
      formData.append('postData', JSON.stringify({
        threadId: data._id,
        title: data.title,
        body: data.body,
        closed: !data.closed
      }))

      fetch(BACKEND + '/api/thread/' + editApi, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token
        },
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) throw Error(data.error?.message || 'Error')
        })
        .catch(err => toast.error(err.message))
    }
  }

  const [banned, setBanned] = useState(data.author?.ban)

  const onBan = () => {
    if (banned) {
      fetch(BACKEND + '/api/ban/delete', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: data.author._id })
      })
        .then(response => response.json())
        .then(data => {
          if (!data.error) {
            setBanned(false)
          } else throw Error(data.error?.message || 'Error')
        })
        .catch(err => toast.error(err.message))
    } else {
      setPostType({
        type: 'ban',
        id: data.author._id,
        someData: {
          body: data.body
        }
      })
      setModalOpen(true)
    }
  }

  const imageView = (url) => {
    setImage(url)
    setImageOpen(true)
  }

  const videoView = (url) => {
    setVideo(url)
    setVideoOpen(true)
  }

  useEffect(() => {
    if (imageOpen || videoOpen) {
      document.body.classList.add('noscroll')
    } else {
      document.body.classList.remove('noscroll')
    }
  }, [imageOpen, videoOpen])

  return (
    <CardBody>
      <header className="card_head">
        <div className="card_head_inner">
          {full ? (
            data.title && (
              <div className="card_title full">
                {data.pined && <i className="thread_pin bx bx-pin" />}
                {data.closed && <i className="thread_lock bx bx-lock-alt" />}
                {data.title}
              </div>
            )
          ) : (
            <Link to={'/thread/' + data._id} className="card_title">
              {data.pined && <i className="thread_pin bx bx-pin" />}
              {data.closed && <i className="thread_lock bx bx-lock-alt" />}
              {data.title}
            </Link>
          )}

          <div className="card_info">
            <Link to={'/user/' + data.author.name} className="head_text bold">
              {data.author.displayName}
              {full && (
                <Fragment>
                  {new Date() - new Date(data.author.onlineAt) < 5 * 60000 && <span className="online" title="online" />}
                  {data.author.role >= 2 ? (
                    <UserRole role={data.author.role} />
                  ) : (
                    <Fragment>
                      {type === 'thread' && <span className="user_status">owner</span>}
                      {type === 'answer' && (
                        data.author._id === threadData.author._id && (
                          <span className="user_status">owner</span>
                        )
                      )}
                    </Fragment>
                  )}
                </Fragment>
              )}
            </Link>
            <span className="bullet">{full ? '-' : '•'}</span>
            <span className="head_text">
              <time>{dateFormat(data.createdAt)}</time>
            </span>
          </div>
        </div>

        {full && user && (
          <Dropdown>
            {user.role >= 2 && (
              <Fragment>
                {type !== 'answer' && (
                  <div
                    onClick={onPin}
                    className="dropdown_item"
                  >
                    {data.pined
                      ? Strings.unpin[lang]
                      : Strings.pin[lang]
                    }
                  </div>
                )}
                {type !== 'answer' && (
                  <div
                    onClick={onClose}
                    className="dropdown_item"
                  >
                    {data.closed
                      ? Strings.open[lang]
                      : Strings.close[lang]
                    }
                  </div>
                )}
                <div onClick={onDelete} className="dropdown_item">{Strings.delete[lang]}</div>
                {data.author.name !== 'deleted' && user.id !== data.author._id && data.author.role === 1 && (
                  <div
                    onClick={onBan}
                    className="dropdown_item"
                  >
                    {banned
                      ? Strings.unbanUser[lang]
                      : Strings.banUser[lang]
                    }
                  </div>
                )}
              </Fragment>
            )}
            {user.id === data.author._id || user.role >= 2
              ? <div onClick={editClick} className="dropdown_item">{Strings.edit[lang]}</div>
              : null
            }
            {type !== 'answer' && user.id === data.author._id && user.role === 1 && (
              <div
                onClick={onClose}
                className="dropdown_item"
              >
                {data.closed
                  ? Strings.open[lang]
                  : Strings.close[lang]
                }
              </div>
            )}
            {user.id !== data.author._id && (
              <div onClick={reportClick} className="dropdown_item">{Strings.report[lang]}</div>
            )}
          </Dropdown>
        )}
      </header>

      {(full || preview) && (
        <Fragment>
          <div
            className={data.attach && data.attach.length === 1 ? 'card_content with_attach_list markdown' : 'card_content markdown'}
          >
            {data.attach && (
              <div className={data.attach.length > 1 ? 'attach_grid' : 'attach_list'}>
                {data.attach.map((item, index) => (
                  <Fragment key={index}>
                    {imageTypes.find(i => i === item.type) ? (
                      <div
                        onClick={() => imageView(BACKEND + item.file)}
                        className="attached_file image_file card_left"
                        style={{ backgroundImage: `url(${BACKEND + item.file})` }}
                      />
                    ) : videoTypes.find(i => i === item.type) ? (
                      <div onClick={() => videoView(BACKEND + item.file)} className="attached_file card_left empty">
                        <div className="attached_info">{regexp.exec(item.file)[1]}</div>
                      </div>
                    ) : (
                      <a href={BACKEND + item.file} className="attached_file card_left empty" target="_blank" rel="noopener noreferrer">
                        <div className="attached_info">{regexp.exec(item.file)[1]}</div>
                      </a>
                    )}
                  </Fragment>
                ))}
              </div>
            )}

            {imageOpen && (
              <Lightbox
                mainSrc={image}
                onCloseRequest={() => setImageOpen(false)}
              />
            )}

            {videoOpen && (
              <VideoLightbox
                source={video}
                onCloseRequest={() => setVideoOpen(false)}
              />
            )}

            <Markdown
              source={collapsed && data.body.length > 200 ? data.body.slice(0, 200) + '...' : data.body}
              onImageClick={imageView}
            />
          </div>

          {preview && data.body.length > 200 && (
            <div
              className="text_show_more"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? Strings.showMore[lang] : Strings.showLess[lang]}
            </div>
          )}
        </Fragment>
      )}

      <footer className="card_foot">
        {full ? (
          <Fragment>
            {data.author.name !== 'deleted' && user && user.id !== data.author._id && (
              <div className="act_btn foot_btn" onClick={() => answerTo(data._id, data.author.displayName)}>
                <i className="bx bx-redo" />
                <span>{Strings.answer[lang]}</span>
              </div>
            )}

            <div className="act_btn foot_btn likes" onClick={onLike}>
              <i className={liked ? 'bx bx-heart liked' : 'bx bx-heart'} />
              {likes.length ? (
                <Fragment>
                  <span className="card_count">{counter(likes.length)}</span>
                  <span className="hidden">
                    {declOfNum(likes.length, [Strings.like1[lang], Strings.like2[lang], Strings.like3[lang]])}
                  </span>
                  {user && (
                    <div className="likes_list" ref={likesList}>
                      {likes.slice(0, 4).map((item, index) => (
                        <Link
                          key={index}
                          to={'/user/' + item.name}
                          className="head_profile"
                          title={item.displayName}
                          style={{ backgroundImage: `url(${item.picture ? BACKEND + item.picture : ''})` }}
                        >
                          {!item.picture && item.displayName.charAt(0)}
                        </Link>
                      ))}
                      {likes.length > 4 && <span>and {likes.length - 4} more</span>}
                    </div>
                  )}
                </Fragment>
              ) : null}
            </div>

            {data.answersCount > 0 && (
              <div className="act_btn foot_btn disable">
                <i className="bx bx-message-square-detail" />
                <span className="card_count">{counter(data.answersCount)}</span>
                <span className="hidden">
                  {declOfNum(data.answersCount, [Strings.answer1[lang], Strings.answer2[lang], Strings.answer3[lang]])}
                </span>
              </div>
            )}
          </Fragment>
        ) : (
          type !== 'answer' ? (
            <div className="act_btn foot_btn disable">
              <i className="bx bx-message-square-detail" />
              <span className="card_count">{counter(data.answersCount)}</span>
              <span className="count_title">
                {declOfNum(data.answersCount, [Strings.answer1[lang], Strings.answer2[lang], Strings.answer3[lang]])}
              </span>
            </div>
          ) : (
            <Link to={'/thread/' + data.threadId} className="act_btn foot_btn">{Strings.open[lang]} {Strings.thread1[lang]}</Link>
          )
        )}
      </footer>

      {full && data.edited && (
        data.edited.createdAt && (
          <div className="act_btn foot_btn under_foot disable">
            <i className="bx bx-pencil" />
            <span className="card_count">
              {dateFormat(data.edited.createdAt)}
            </span>
          </div>
        )
      )}
    </CardBody>
  )
}

export const BoardCard = ({ data }) => {
  const { lang } = useContext(StoreContext)

  return (
    <CardBody>
      <header className="card_head">
        <div className="card_head_inner">
          <Link to={'/boards/' + data.name} className="card_title">{data.title}</Link>
        </div>
      </header>

      <footer className="card_foot">
        <div className="act_btn foot_btn disable">
          <i className="bx bx-news" />
          <span className="card_count">{counter(data.threadsCount)}</span>
          <span className="count_title">
            {declOfNum(data.threadsCount, [Strings.thread1[lang], Strings.thread2[lang], Strings.thread3[lang]])}
          </span>
        </div>

        <div className="act_btn foot_btn disable">
          <i className="bx bx-message-square-detail" />
          <span className="card_count">{counter(data.answersCount)}</span>
          <span className="count_title">
            {declOfNum(data.answersCount, [Strings.answer1[lang], Strings.answer2[lang], Strings.answer3[lang]])}
          </span>
        </div>
      </footer>
    </CardBody>
  )
}

export const UserCard = ({ data, online }) => {
  return (
    <CardBody>
      <Link to={'/user/' + data.name} className="card_head user_head">
        <div className="card_head_inner">
          <div className="card_title user_title">
            {data.picture ? (
              <div className="head_profile" style={{ backgroundImage: `url(${BACKEND + data.picture})` }} />
            ) : (
              <div className="head_profile">
                {data.displayName.charAt(0)}
              </div>
            )}
            <div className="user_info">
              <div className="user_info_top">
                {data.displayName}
                <UserRole role={data.role} />
              </div>
               {!online && (
                <div className="head_text">
                  {new Date() - new Date(data.onlineAt) < 5 * 60000 ? 'online' : dateFormat(data.onlineAt)}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </CardBody>
  )
}

export const BannedCard = ({ data, unBan }) => {
  const { lang } = useContext(StoreContext)

  if (data.ban.admin === null) {
    data.ban.admin = deletedUser
  }

  return (
    <CardBody>
      <div className="card_head user_head">
        <div className="card_head_inner row">
          <Link to={'/user/' + data.name} className="card_title user_title">
            {data.picture ? (
              <div className="head_profile" style={{ backgroundImage: `url(${BACKEND + data.picture})` }} />
            ) : (
              <div className="head_profile">
                {data.displayName.charAt(0)}
              </div>
            )}
            <div className="user_info">
              <div className="user_info_top">
                {data.displayName}
              </div>
              <div className="head_text">{dateFormat(data.ban?.createdAt)}</div>
            </div>
          </Link>

          <div className="edit_action_menu">
            <div className="action delete" onClick={() => unBan(data._id)}>
              <i className="bx bx-trash-alt" />
            </div>
          </div>
        </div>
      </div>

      <div className="card_content">
        <p>
          <span className="secondary_text">{Strings.reason[lang]}:</span>
          {data.ban?.reason}
        </p>
        <p>
          <span className="secondary_text">{Strings.banExpires[lang]}:</span>
          {dateFormat(data.ban?.expiresAt)}
        </p>
      </div>

      <footer className="card_foot">
        <div className="act_btn foot_btn disable">
          <span className="card_count">Admin: {data.ban?.admin?.displayName}</span>
        </div>
      </footer>
    </CardBody>
  )
}

export const BannedAll = ({ data }) => {
  const { lang } = useContext(StoreContext)

  if (data.admin === null) {
    data.admin = deletedUser
  }

  return (
    <CardBody>
      <div className="card_head user_head">
        <div className="card_head_inner row">
          <Link to={'/user/' + data.user.name} className="card_title user_title">
            {data.user.picture ? (
              <div className="head_profile" style={{ backgroundImage: `url(${BACKEND + data.user.picture})` }} />
            ) : (
              <div className="head_profile">
                {data.user.displayName.charAt(0)}
              </div>
            )}
            <div className="user_info">
              <div className="user_info_top">
                {data.user.displayName}
              </div>
              <div className="head_text">{dateFormat(data.createdAt)}</div>
            </div>
          </Link>
        </div>
      </div>

      <div className="card_content">
        <p>
          <span className="secondary_text">{Strings.reason[lang]}:</span>
          {data.reason}
        </p>
        <p>
          <span className="secondary_text">{Strings.banExpires[lang]}:</span>
          {dateFormat(data.expiresAt)}
        </p>
      </div>

      <footer className="card_foot">
        <div className="act_btn foot_btn disable">
          <span className="card_count">Admin: {data.admin?.displayName}</span>
        </div>
      </footer>
    </CardBody>
  )
}

export const BanInfoCard = ({ data, owner }) => {
  const { lang } = useContext(StoreContext)

  if (data.admin === null) {
    data.admin = deletedUser
  }

  return (
    <CardBody>
      <div className="card_head">
        <div className="card_head_inner">
          <div className="card_title full">{owner ? Strings.youAreBanned[lang] : Strings.userBanned[lang]}</div>
          <div className="card_info">
            <div className="head_text bold">Admin: {data.admin?.displayName}</div>
            <span className="bullet">•</span>
            <span className="head_text">
              <time>{dateFormat(data.createdAt)}</time>
            </span>
          </div>
        </div>
      </div>

      <div className="card_content">
        <p>
          <span className="secondary_text">{Strings.reason[lang]}:</span>
          {data.reason}
        </p>
        <p>
          <span className="secondary_text">{Strings.banExpires[lang]}:</span>
          {dateFormat(data.expiresAt)}
        </p>
      </div>
    </CardBody>
  )
}

export const NotificationCard = ({ data }) => {
  const { lang } = useContext(StoreContext)
  const [collapsed, setCollapsed] = useState(true)

  if (data.from === null) {
    data.from = deletedUser
  }

  let pagePath = '/thread/' + data.threadId
  if (data.type === 'answerToThread' || data.type === 'answerToAnswer') {
    pagePath = '/thread/' + data.pageId
  }
  if (data.type === 'commentToFile' || data.type === 'commentToComment') {
    pagePath = '/file/' + data.pageId
  }

  return (
    <div className="card_item">
      <div className="card_body">
        <div className={data.read ? 'card_block' : 'card_block noread'}>
          <header className="card_head">
            <div className="card_head_inner">
              <Link to={pagePath} className="card_title">
                {data.title}
              </Link>

              <div className="card_info">
                <Link to={'/user/' + data.from.name} className="head_text bold">
                  {data.from.displayName}
                  <UserRole role={data.from.role} />
                </Link>
                <span className="bullet">•</span>
                <span className="head_text">
                  <time>{dateFormat(data.createdAt)}</time>
                </span>
              </div>
            </div>
          </header>

          <div className="card_content markdown">
            <Markdown source={collapsed && data.body.length > 200 ? data.body.slice(0, 200) + '...' : data.body} />
          </div>

          {data.body.length > 200 && (
            <div className="text_show_more" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? Strings.showMore[lang] : Strings.showLess[lang]}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const FolderCard = ({ data }) => {
  const { lang } = useContext(StoreContext)

  return (
    <CardBody>
      <header className="card_head">
        <div className="card_head_inner">
          <Link to={'/uploads/' + data.name} className="card_title">{data.title}</Link>
        </div>
      </header>

      <footer className="card_foot">
        <div className="act_btn foot_btn disable">
          <i className="bx bx-file-blank" />
          <span className="card_count">{counter(data.filesCount)}</span>
          <span className="count_title">
            {declOfNum(data.threadsCount, [Strings.file1[lang], Strings.file2[lang], Strings.file3[lang]])}
          </span>
        </div>
      </footer>
    </CardBody>
  )
}

export const FileCard = ({ data, deleteFile }) => {
  const { lang } = useContext(StoreContext)

  if (data.author === null) {
    data.author = deletedUser
  }

  return (
    <div className="card_item file_card">
      <div className="card_body">
        <div className="card_block with_left">
          {imageTypes.find(i => i === data.file.type) ? (
            <div
              className="card_left"
              style={{ backgroundImage: `url(${BACKEND + data.file.url})` }}
            />
          ) : (
            <div className="card_left empty" />
          )}

          <div className="card_right">
            <header className="card_head">
              <div className="card_head_inner">
                <Link to={'/file/' + data._id} className="card_title">{data.title}</Link>

                <div className="card_info">
                  <Link to={'/user/' + data.author.name} className="head_text bold">{data.author.displayName}</Link>
                  <span className="bullet">•</span>
                  <span className="head_text">
                    <time>{dateFormat(data.createdAt, 'mini')}</time>
                  </span>
                </div>
              </div>
            </header>

            <footer className="card_foot">
              <div className="act_btn foot_btn disable">
                <i className="bx bx-download" />
                <span className="card_count">{counter(data.downloads)}</span>
                <span className="hidden">
                  {declOfNum(data.downloads, [Strings.download1[lang], Strings.download2[lang], Strings.download3[lang]])}
                </span>
              </div>

              <div className="act_btn foot_btn disable">
                <i className="bx bx-heart" />
                  <span className="card_count">{counter(data.likes.length)}</span>
                  <span className="hidden">
                    {declOfNum(data.likes.length, [Strings.like1[lang], Strings.like2[lang], Strings.like3[lang]])}
                  </span>
              </div>

              {deleteFile && (
                <div className="act_btn foot_btn delete" onClick={() => deleteFile(data._id)}>
                  <i className="bx bx-trash-alt" />
                </div>
              )}
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}

export const DialoqueCard = ({ data }) => {
  const { user, lang } = useContext(StoreContext)
  let key = 'from'
  if (user.id === data.from?._id) {
    key = 'to'
  }

  if (data[key] === null) {
    data[key] = deletedUser
  }

  return (
    <div className="card_item">
      <div className="card_body">
        <div className={data.lastMessage.read ? 'card_block' : 'card_block noread'}>
          <header className="card_head user_head">
            <div className="card_head_inner">
              <Link to={'/messages/' + data[key].name} className="card_title user_title">
                {data[key].picture ? (
                  <div className="head_profile" style={{ backgroundImage: `url(${BACKEND + data[key].picture})` }} />
                ) : (
                  <div className="head_profile">
                    {data[key].displayName.charAt(0)}
                  </div>
                )}
                <div className="user_info">
                  <div className="user_info_top">
                    {data[key].displayName}
                    <UserRole role={data[key].role} />
                  </div>
                  <div className="head_text">
                    {data.lastMessage?.from === user.id && `${Strings.you[lang]}: `}
                    {data.lastMessage?.body.length
                      ? data.lastMessage.body
                      : data.lastMessage?.file.length ? Strings.file[lang] : Strings.message[lang]
                    }
                  </div>
                </div>
              </Link>
              <span className="message_time">{dateFormat(data.lastMessage.createdAt, 'mini')}</span>
            </div>
          </header>
        </div>
      </div>
    </div>
  )
}
