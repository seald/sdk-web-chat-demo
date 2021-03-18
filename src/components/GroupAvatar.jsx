import React from 'react'
import Avatar from '@material-ui/core/Avatar'
import AvatarGroup from '@material-ui/lab/AvatarGroup'

function GroupAvatars({ users, max = 3 }) {
  return (
    <AvatarGroup max={max}>
      {Object.keys(users).map(key => (
        <Avatar key={key} alt={users[key].displayName} src={users[key].photoURL} />
      ))}
    </AvatarGroup>
  )
}

export default GroupAvatars
