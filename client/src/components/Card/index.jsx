import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import Lightbox from 'react-image-lightbox';

import { StoreContext } from 'store/Store';
import { counter, declOfNum, dateFormat } from 'support/Utils';
import { BACKEND } from 'support/Constants';

import Dropdown from './Dropdown';
import Markdown from 'components/Markdown';

const Card = ({ data, threadData, full = false, type }) => {
  const { user, token, setModalOpen, setPostType, setFabVisible } = useContext(StoreContext)
  const history = useHistory()
  const likesList = useRef()
  const [likes, setLikes] = useState(data.likes)
  const [liked, setLiked] = useState(user ? !!data?.likes?.find(i => i._id === user.id) : false)
  const [image, setImage] = useState('')
  const [imageOpen, setImageOpen] = useState(false)
  const regexp = /(?:\.([^.]+))?$/

  useEffect(() => {
    if (type === 'thread' && data.closed) {
      setFabVisible(false)
    }
    if (type === 'thread' && !data.closed) {
      setFabVisible(true)
    }
  }, [data.closed])

  const imageTypes = ['image/jpeg', 'image/png', 'image/gif']

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
        }
      })
      .catch(err => console.error)
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
        }
      })
      .catch(err => console.error)
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
    const admin = user.role === 'admin' ? true : false
    let postType
    if (type === 'thread' && admin) {
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

  const answerTo = (toId, displayName) => {
    let id
    if (type === 'answer') {
      id = data.threadId
    } else {
      id = data._id
    }
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
          history.push('/')
        }
      })
      .catch(err => console.error)
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
      .catch(err => console.error)
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
      fetch(BACKEND + '/api/thread/adminedit', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          threadId: data._id,
          title: data.title,
          body: data.body,
          pined: !data.pined
        })
      })
        .then(response => response.json())
        .catch(err => console.error)
    }
  }

  const onClose = () => {
    if (type !== 'answer') {
      const editApi = user.role === 'admin' ? 'adminedit' : 'edit'

      fetch(BACKEND + '/api/thread/' + editApi, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          threadId: data._id,
          title: data.title,
          body: data.body,
          closed: !data.closed
        })
      })
        .then(response => response.json())
        .catch(err => console.error)
    }
  }

  const imageView = (url) => {
    setImage(url)
    setImageOpen(true)
  }

  useEffect(() => {
    if (imageOpen) {
      document.body.classList.add('noscroll')
    } else {
      document.body.classList.remove('noscroll')
    }
  }, [imageOpen])

  return (
    <div className="card_item">
      <div className="card_body">
        <div className="card_block">
          <header className="card_head">
            <div className="card_head_inner">
              {full ? (
                data.title && (
                  <div className="card_title full">
                    {data.pined && <i className="thread_pin bx bx-pin"></i>}
                    {data.closed && <i className="thread_lock bx bx-lock-alt"></i>}
                    {data.title}
                  </div>
                )
              ) : (
                <Link to={'/thread/' + data._id} className="card_title">
                  {data.pined && <i className="thread_pin bx bx-pin"></i>}
                  {data.closed && <i className="thread_lock bx bx-lock-alt"></i>}
                  {data.title}
                </Link>
              )}

              <div className="card_info">
                <Link to={'/user/' + data.author.name} className="head_text bold">
                  {data.author.displayName}
                  {full && (
                    <Fragment>
                      {new Date() - new Date(data.author.onlineAt) < 5 * 60000 && <span className="online" title="online"></span>}
                      {data.author.role === 'admin' ? (
                        <span className="user_status">admin</span>
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
                {user.role === 'admin' && (
                  <Fragment>
                    {type !== 'answer' && <div onClick={onPin} className="dropdown_item">{data.pined ? 'Unpin' : 'Pin'}</div>}
                    {type !== 'answer' && <div onClick={onClose} className="dropdown_item">{data.closed ? 'Open' : 'Close'}</div>}
                    <div onClick={onDelete} className="dropdown_item">Delete</div>
                    <div className="dropdown_item">Ban user</div>
                  </Fragment>
                )}
                {user.id === data.author._id || user.role === 'admin'
                  ? <div onClick={editClick} className="dropdown_item">Edit</div>
                  : null
                }
                {type !== 'answer' && user.id === data.author._id && user.role !== 'admin' && (
                  <div onClick={onClose} className="dropdown_item">{data.closed ? 'Open' : 'Close'}</div>
                )}
                {user.id !== data.author._id && (
                  <div className="dropdown_item">Report</div>
                )}
              </Dropdown>
            )}
          </header>

          {full && (
            <div className="card_content markdown">
              <Markdown source={data.body} onImageClick={imageView} />

              {data.attach && (
                <div className="attach_list">
                  {data.attach.map((item, index) => (
                    <Fragment key={index}>
                      {imageTypes.find(i => i === item.type) ? (
                        <div onClick={() => imageView(item.file)} className="attached_file card_left" style={{ backgroundImage: `url(${item.file})` }}></div>
                      ) : (
                        <a href={item.file} className="attached_file card_left empty" target="_blank" rel="noopener noreferrer">
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
            </div>
          )}

          <footer className="card_foot">
            {full ? (
              <Fragment>
                {user && user.id !== data.author._id && (
                  <div className="act_btn foot_btn" onClick={() => answerTo(data._id, data.author.displayName)}>
                    <i className="bx bx-redo"></i>
                    <span>Answer</span>
                  </div>
                )}

                <div className="act_btn foot_btn likes" onClick={onLike}>
                  <i className={liked ? 'bx bx-heart liked' : 'bx bx-heart'}></i>
                  {likes.length ? (
                    <Fragment>
                      <span className="card_count">{counter(likes.length)}</span>
                      <span className="hidden">{declOfNum(likes.length, ['like', 'likes', 'likes'])}</span>
                      {user && (
                        <div className="likes_list" ref={likesList}>
                          {likes.slice(0, 4).map((item, index) => (
                            <Link key={index} to={'/user/' + item.name} className="head_profile" title={item.displayName} style={{ backgroundImage: `url(${item.picture})` }}>
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
                    <i className="bx bx-message-square-detail"></i>
                    <span className="card_count">{counter(data.answersCount)}</span>
                    <span className="hidden">{declOfNum(data.answersCount, ['answer', 'answers', 'answers'])}</span>
                  </div>
                )}
              </Fragment>
            ) : (
              <div className="act_btn foot_btn disable">
                <i className="bx bx-message-square-detail"></i>
                <span className="card_count">{counter(data.answersCount)}</span>
                <span className="hidden">{declOfNum(data.answersCount, ['answer', 'answers', 'answers'])}</span>
              </div>
            )}
          </footer>

          {full && data.edited && (
            data.edited.createdAt && (
              <div className="act_btn foot_btn under_foot disable">
                <i className="bx bx-pencil"></i>
                <span className="card_count">
                  {dateFormat(data.edited.createdAt)}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

const BoardCard = ({ data }) => {
  return (
    <div className="card_item">
      <div className="card_body">
        <div className="card_block">
          <header className="card_head">
            <div className="card_head_inner">
              <Link to={'/boards/' + data.name} className="card_title">{data.title}</Link>
            </div>
          </header>

          <footer className="card_foot">
            <div className="act_btn foot_btn disable">
              <i className="bx bx-news"></i>
              <span className="card_count">{counter(data.threadsCount)}</span>
              <span className="hidden">{declOfNum(data.threadsCount, ['thread', 'threads', 'threads'])}</span>
            </div>

            <div className="act_btn foot_btn disable">
              <i className="bx bx-message-square-detail"></i>
              <span className="card_count">{counter(data.answersCount)}</span>
              <span className="hidden">{declOfNum(data.answersCount, ['answer', 'answers', 'answers'])}</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

const UserCard = ({ data }) => {
  return (
    <div className="card_item">
      <div className="card_body">
        <div className="card_block">
          <Link to={'/user/' + data.name} className="card_head user_head">
            <div className="card_head_inner">
              <div className="card_title user_title">
                <div className="head_profile" style={{ backgroundImage: `url(${data.picture})` }}>
                  {!data.picture && data.displayName.charAt(0)}
                </div>
                <div className="user_info">
                  <div className="user_info_top">
                    {data.displayName}
                    {data.role === 'admin' && <span className="user_status">admin</span>}
                  </div>
                  <div className="head_text">{dateFormat(data.onlineAt)}</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

const NotificationCard = ({ data }) => {
  return (
    <div className="card_item">
      <div className="card_body">
        <div className={data.read ? 'card_block' : 'card_block noread'}>
          <header className="card_head">
            <div className="card_head_inner">
              <Link to={'/thread/' + data.threadId} className="card_title">
                {data.title}
              </Link>

              <div className="card_info">
                <Link to={'/user/' + data.from.name} className="head_text bold">
                  {data.from.displayName}
                  {data.from.role === 'admin' && <span className="user_status">admin</span>}
                </Link>
                <span className="bullet">•</span>
                <span className="head_text">
                  <time>{dateFormat(data.createdAt)}</time>
                </span>
              </div>
            </div>
          </header>

          <div className="card_content markdown">
            <Markdown source={data.body} />
          </div>
        </div>
      </div>
    </div>
  )
}

export { Card, BoardCard, UserCard, NotificationCard };
