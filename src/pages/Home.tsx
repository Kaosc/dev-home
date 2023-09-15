import { useState, useCallback, useRef } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useScrolling } from "react-use"
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
	DragOverEvent,
	TouchSensor,
} from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"

import { editGroup, setBookmarkGroups } from "../redux/features/bookmarkSlice"

import GroupContainer from "../components/GroupContainer"
import Bookmark from "../components/sortable/Bookmark"

// get scroll event
export default function Home() {
	const bookmarkGroups = useSelector((state: RootState) => state.bookmarks)
	const dispatch = useDispatch()

	const [activeBookmark, setActiveBookmark] = useState<Bookmark>()

	const scrollRef = useRef<HTMLDivElement>(null)
	const scrolling = useScrolling(scrollRef)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				delay: 100,
				tolerance: 5,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 100,
				tolerance: 5,
			},
		})
	)

	const handleDragStart = useCallback(
		(event: DragEndEvent) => {
			const { active } = event
			const { id } = active

			setActiveBookmark(
				bookmarkGroups
					.map((group) => group.bookmarks)
					.flat()
					.find((bookmark) => bookmark.id === id)
			)
		},
		[bookmarkGroups]
	)

	const handleDragOver = useCallback(
		(event: DragOverEvent) => {
			const { active, over } = event

			// Add a check to prevent unnecessary updates
			if (!active || !over || active.id === over.id) {
				return
			}

			const activeBookmarkId = active.id
			const activeBookmarkGroupId = active.data.current?.sortable.containerId || activeBookmarkId

			const overBookmarkId = over?.id
			const overBookmarkGroupId = over?.data.current?.sortable.containerId || overBookmarkId

			if (!activeBookmarkId || !overBookmarkId || activeBookmarkGroupId === overBookmarkGroupId) {
				return
			}

			const activeBookmarkGroup = bookmarkGroups.find((group) => group.id === activeBookmarkGroupId)
			const overBookmarkGroup = bookmarkGroups.find((group) => group.id === overBookmarkGroupId)

			if (!overBookmarkGroup || !activeBookmarkGroup) return

			const activeBookmarkIndex = activeBookmarkGroup.bookmarks.findIndex(
				(bookmark) => bookmark.id === activeBookmarkId
			)

			if (activeBookmarkIndex === -1) {
				return
			}

			const updatedActiveGroup = {
				...activeBookmarkGroup,
				bookmarks: [
					...activeBookmarkGroup.bookmarks.slice(0, activeBookmarkIndex),
					...activeBookmarkGroup.bookmarks.slice(activeBookmarkIndex + 1),
				],
			}

			const updatedOverGroup = {
				...overBookmarkGroup,
				bookmarks: [...overBookmarkGroup.bookmarks, activeBookmarkGroup.bookmarks[activeBookmarkIndex]],
			}

			if (scrolling) return

			if (activeBookmarkGroup.id !== overBookmarkGroup.id) {
				dispatch(
					setBookmarkGroups(
						bookmarkGroups.map((group) => {
							if (group.id === activeBookmarkGroupId) {
								return updatedActiveGroup
							} else if (group.id === overBookmarkGroupId) {
								return updatedOverGroup
							} else {
								return group
							}
						})
					)
				)
			}
		},
		[bookmarkGroups, dispatch, scrolling]
	)

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event

			if (!active) {
				return
			}

			const activeBookmarkIndex = active.data.current?.sortable.index

			const overBookmarkIndex = over?.data.current?.sortable.index
			const overBookmarkGroupId = over?.data.current?.sortable.containerId
			const overBookmarkGroup = bookmarkGroups.find((group) => group.id === overBookmarkGroupId)

			if (
				!activeBookmarkIndex !== undefined &&
				overBookmarkIndex === undefined &&
				activeBookmarkIndex === overBookmarkIndex
			) {
				return
			}

			if (overBookmarkGroup) {
				const newGroup = arrayMove(overBookmarkGroup.bookmarks, activeBookmarkIndex, overBookmarkIndex)

				dispatch(
					editGroup({
						id: overBookmarkGroupId,
						title: overBookmarkGroup.title,
						bookmarks: newGroup,
					})
				)
			}

			setActiveBookmark(undefined)
		},
		[bookmarkGroups, dispatch]
	)

	return (
		<main
			className="overflow-y-auto bg-gradient-to-r from-[#0e0e0e] to-zinc-950"
			ref={scrollRef}
		>
			<DndContext
				sensors={sensors}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onDragOver={handleDragOver}
			>
				{bookmarkGroups.map((bookmarkData) => (
					<GroupContainer
						key={bookmarkData.id}
						bookmarkData={bookmarkData}
					/>
				))}
				<DragOverlay
					transition={undefined}
					adjustScale={false}
				>
					{activeBookmark ? (
						<Bookmark
							key={"activeBookmark"}
							opacity="opacity-50"
							bookmark={activeBookmark}
						/>
					) : null}
				</DragOverlay>
			</DndContext>
		</main>
	)
}
