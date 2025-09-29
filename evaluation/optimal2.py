import json
import pandas as pd

# ----------------------------
# 读取多个数据文件
# ----------------------------
import glob
import os


json_files = glob.glob("C:/Users/Administrator/Desktop/cope/COPE/evaluation/data/*.json")
print(f"找到 {len(json_files)} 个JSON文件: {json_files}")

all_session_metrics = []
for file_path in json_files:
    print(f"正在处理文件: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        session_data = json.load(f)

    query_keys = [k for k in session_data.keys() if k not in ["scroll", "overallButton"]]
    
    # ----------------------------
    # 初始化指标列表
    # ----------------------------
    engagements = 0
    dsat_engagement = 0
    first_engage_time = None
    last_engage_time = None
    session_depth = 0
    user_text_lengths = []
    system_text_lengths = []
    query_order_rr = []  
    last_dsat_engagement_query_order = 0  
    navigate_dwell_times = []  
    navigate_count = 0  
    
     # Copy相关指标
    copy_total_count = 0    
    copy_query_orders = [] 
    copy_text_lengths = [] 
    copy_dwell_times = []  
    
    # Button相关指标
    button_total_count = 0  
    button_query_orders = []  
    regenerate_count = 0  
    edit_count = 0  
    regenerate_query_orders = []  
    edit_query_orders = []  

    # OverallButton相关指标
    overall_button_total_count = 0  
    stop_generating_count = 0  
    

    # 遍历每个 Query 阶段
    current_msg_index = 0
    session_depth = len(query_keys) // 2
    for key in query_keys:
        queries = session_data.get(key, [])
        for q in queries:
            current_msg_index += 1
            current_query_index = (current_msg_index + 1) // 2
            for msg_id, msg in q.items():
                # 文本长度
                if msg["role"] == "user":
                    user_text_lengths.append(len(msg["text"]))
                else:
                    system_text_lengths.append(len(msg["text"]))
                
                # Engagement 判定和计数
                # 基础engagement (click 或 hover)
                base_engage = (msg.get("count_num",0) > 0) or (msg.get("hover_count",0) > 0)
                
                # copy_details中的每个条目算一次engagement
                copy_engagements = len(msg.get("copy_details", []))
                
                # buttons中的每个条目算一次engagement  
                button_engagements = len(msg.get("buttons", []))
                
                # 总engagement次数
                total_engagements = (1 if base_engage else 0) + copy_engagements + button_engagements
                
                if total_engagements > 0:
                    engagements += total_engagements
                    t = pd.to_datetime(msg["time_stamp"])
                    if first_engage_time is None:
                        first_engage_time = t
                    last_engage_time = t
                    
                    # 计算查询位置倒数 (1/query_position) - 每个engagement都添加
                    for _ in range(total_engagements):
                        query_order_rr.append(1.0 / current_query_index)

                    # 不满意 Engagement 判定 (只考虑基础engagement)
                    if base_engage:
                        hover_count = msg.get("hover_count",0)
                        hover_duration = msg.get("hover_duration_ms",0)
                        avg_hover = hover_duration / hover_count if hover_count>0 else 0
                        # 检查是否有不满意的按钮点击
                        buttons = msg.get("buttons", [])
                        has_bad_response = any(button.get("name", "").lower() == "bad response" for button in buttons)
                        has_regenerate = any(button.get("name", "").lower() == "regenerate" for button in buttons)
                        
                        if avg_hover < 30000 or has_bad_response or has_regenerate:
                            dsat_engagement += 1
                            last_dsat_engagement_query_order = current_query_index
                
                # 处理导航停留时间和计数
                navigate_details = msg.get("navigate_details", [])
                navigate_count += len(navigate_details)  # 统计导航行为总数
                for nav in navigate_details:
                    if nav.get("start_timestamp") and nav.get("return_timestamp"):
                        start_time = pd.to_datetime(nav["start_timestamp"])
                        return_time = pd.to_datetime(nav["return_timestamp"])
                        dwell_time = (return_time - start_time).total_seconds()
                        navigate_dwell_times.append(dwell_time)

                # 处理copy相关指标
                copy_details = msg.get("copy_details", [])
                if copy_details:  # 如果存在copy行为
                    copy_total_count += len(copy_details)
                    copy_query_orders.append(current_query_index)
                    
                    # 收集copy文本长度和hover时间
                    for copy_detail in copy_details:
                        if "text" in copy_detail:
                            copy_text_lengths.append(len(copy_detail["text"]))
                    
                    # 如果copy_details不为空，记录hover时间
                    hover_duration = msg.get("hover_duration_ms", 0)
                    if hover_duration > 0:
                        copy_dwell_times.append(hover_duration)
    
                # 处理button相关指标
                buttons = msg.get("buttons", [])
                if buttons:  # 如果存在button行为
                    button_total_count += len(buttons)
                    button_query_orders.append(current_query_index)
                    
                    # 统计特定按钮类型
                    for button in buttons:
                        button_name = button.get("name", "").lower()
                        if "regenerate" in button_name:
                            regenerate_count += 1
                            regenerate_query_orders.append(current_query_index)
                        elif "edit" in button_name:
                            edit_count += 1
                            edit_query_orders.append(current_query_index)
    
    # ----------------------------
    # 处理OverallButton相关指标
    # ----------------------------
    overall_buttons = session_data.get("overallButton", [])
    if overall_buttons:  # 如果存在overallButton行为
        overall_button_total_count = len(overall_buttons)
        
        # 统计stop generating按钮
        for button in overall_buttons:
            button_name = button.get("name", "").lower()
            if "stop generating" in button_name:
                stop_generating_count += 1
    
    
    # ----------------------------
    # 滚动指标
    # ----------------------------
    scrolls = session_data.get("scroll", [])
    max_scroll_distance = max([abs(s.get("distance",0)) for s in scrolls], default=0)
    
    # 回滚计数
    scroll_back_count = sum(1 for i in range(1,len(scrolls)) 
                            if scrolls[i]["direction"] != scrolls[i-1]["direction"] and scrolls[i]["direction"]!="none")
    
    # 来回滚动次数占比（MixedScrollRatio）
    mixed_scroll_count = sum(1 for i in range(1,len(scrolls)) 
                            if scrolls[i]["direction"] != scrolls[i-1]["direction"] and scrolls[i]["direction"] in ["up","down"])
    mixed_scroll_ratio = mixed_scroll_count / len(scrolls) if scrolls else 0
    
    # 滚动波动性（ScrollVolatility）
    direction_change_count = sum(1 for i in range(1, len(scrolls)) 
                               if scrolls[i]["direction"] != scrolls[i-1]["direction"])
    scroll_volatility = direction_change_count / (len(scrolls) - 1) if len(scrolls) > 1 else 0
    
    # 平均暂停时间（AvgPauseTime）
    pause_times = []
    for i in range(1, len(scrolls)):
        prev_end_time = pd.to_datetime(scrolls[i-1]["endTime"])
        curr_start_time = pd.to_datetime(scrolls[i]["startTime"])
        pause_time = (curr_start_time - prev_end_time).total_seconds()
        pause_times.append(pause_time)
    avg_pause_time = sum(pause_times) / len(pause_times) if pause_times else 0
    
    # 总滚动时间 / 平均滚动时间
    total_scroll_time = sum([(pd.to_datetime(s["endTime"]) - pd.to_datetime(s["startTime"])).total_seconds()
                             for s in scrolls])
    ave_scroll_time = total_scroll_time / len(scrolls) if scrolls else 0
    
    # 是否有滚动回到顶部
    scroll_top_rate = 1 if any(s.get("edge","")=="top" for s in scrolls) else 0
    
    # ----------------------------
    # 计算指标
    # ----------------------------
    session_metric = {
        "id": os.path.basename(file_path).replace('.json', ''), 
        "SessionDwellTime": 0,
        "UniqueEngagementRate": 1 if engagements>0 else 0,
        "SessionEngagementRate": engagements,
        "QueryEngagementRate": engagements/session_depth if session_depth>0 else 0,
        "SessionDepth": session_depth,
        "TimeToFirstEngagement": (first_engage_time - pd.to_datetime(scrolls[0]["startTime"])).total_seconds() if first_engage_time and scrolls else None,
        "TimeToLastEngagement": (last_engage_time - pd.to_datetime(scrolls[0]["startTime"])).total_seconds() if last_engage_time and scrolls else None,
        "DsatEngagementCount": dsat_engagement,
        "DsatEngagementRatio": dsat_engagement/engagements if engagements>0 else 0,
        "AveUserTextLength": sum(user_text_lengths)/len(user_text_lengths) if user_text_lengths else 0,
        "AveSystemTextLength": sum(system_text_lengths)/len(system_text_lengths) if system_text_lengths else 0,
        "MaxScrollDistance": max_scroll_distance,
        "MaxScrollQueryDepth": 0,
        "MaxScrollDistance_rel": max_scroll_distance * session_depth,
        "MaxScrollQueryDepth_rel": 0 * session_depth,
        "ScrollBackCount": scroll_back_count,
        "ScrollBackCount_rel": scroll_back_count * session_depth,
        "ScrollBackQueryDepth": 0,
        "ScrollBackQueryDepth_rel": 0 * session_depth,
        "MixedScrollCount": mixed_scroll_count,
        "MixedScrollCount_rel": mixed_scroll_count * session_depth,
        "MixedScrollRatio": mixed_scroll_ratio,
        "MixedScrollRatio_rel": mixed_scroll_ratio * session_depth,
        "SumScrollTime": total_scroll_time,
        "AveScrollTime": ave_scroll_time,
        "ScrollTopRate": scroll_top_rate,
        "MinQueryOrderRR": min(query_order_rr) if query_order_rr else 0,
        "MaxQueryOrderRR": max(query_order_rr) if query_order_rr else 0,
        "MeanQueryOrderRR": sum(query_order_rr) / len(query_order_rr) if query_order_rr else 0,
        "ScrollVolatility": scroll_volatility,
        "AvgPauseTime": avg_pause_time,
        "LastDsatEngagementQueryOrder": last_dsat_engagement_query_order,
        "LastDsatEngagementQueryOrder_rel": last_dsat_engagement_query_order * session_depth,
        "NavigateCount": navigate_count,
        "SumNavigateDwell": sum(navigate_dwell_times),
        "AveNavigateDwell": sum(navigate_dwell_times) / len(navigate_dwell_times) if navigate_dwell_times else 0,
        "PLE_abs": engagements * max(query_order_rr) if query_order_rr else 0,
        "PLE_rel": engagements * max(query_order_rr) * session_depth if query_order_rr else 0,

        # Copy相关指标
        "CopyUniqueItemRate": 1 if copy_total_count > 0 else 0,  
        "CopyCountPerQuery": copy_total_count / session_depth if session_depth > 0 else 0,  
        "FirstCopyQueryOrder": min(copy_query_orders) if copy_query_orders else 0,  
        "LastCopyQueryOrder": max(copy_query_orders) if copy_query_orders else 0,  
        "FirstCopyQueryOrder_rel":  min(copy_query_orders) * session_depth if copy_query_orders else 0,
        "LastCopyQueryOrder_rel":  max(copy_query_orders) * session_depth if copy_query_orders else 0,
        "AveCopyInlineText": sum(copy_text_lengths) / len(copy_text_lengths) if copy_text_lengths else 0,   
        "AveCopyDwellTime": sum(copy_dwell_times) / len(copy_dwell_times) if copy_dwell_times else 0,

        # Button相关指标
        "UniqueButtonRate": 1 if button_total_count > 0 else 0, 
        "ButtonCountPerQuery": button_total_count / session_depth if session_depth > 0 else 0, 
        "FirstButtonQueryOrder": min(button_query_orders) if button_query_orders else 0, 
        "LastButtonQueryOrder": max(button_query_orders) if button_query_orders else 0, 
        "FirstButtonQueryOrder_rel": min(button_query_orders) * session_depth if button_query_orders else 0,
        "LastButtonQueryOrder_rel": max(button_query_orders) * session_depth if button_query_orders else 0,
        "RegenerateCount": regenerate_count,  
        "EditCount": edit_count, 
        "FirstRegenerateQueryOrder": min(regenerate_query_orders) if regenerate_query_orders else 0, 
        "LastRegenerateQueryOrder": max(regenerate_query_orders) if regenerate_query_orders else 0, 
        "FirstEditQueryOrder": min(edit_query_orders) if edit_query_orders else 0, 
        "LastEditQueryOrder": max(edit_query_orders) if edit_query_orders else 0 ,
        "FirstRegenerateQueryOrder_rel": min(regenerate_query_orders) * session_depth if regenerate_query_orders else 0,
        "LastRegenerateQueryOrder_rel": max(regenerate_query_orders) * session_depth if regenerate_query_orders else 0,
        "FirstEditQueryOrder_rel": min(edit_query_orders) * session_depth if edit_query_orders else 0,
        "LastEditQueryOrder_rel": max(edit_query_orders) * session_depth if edit_query_orders else 0,
        "PositiveButtonCount": 0,
        "NegativeButtonCount": 0,
        "FirstPositiveButtonQueryOrder": 0,
        "LastPositiveButtonQueryOrder": 0,
        "FirstNegativeButtonQueryOrder": 0,
        "LastNegativeButtonQueryOrder": 0,
        "FirstPositiveButtonQueryOrder_rel": 0 * session_depth,
        "LastPositiveButtonQueryOrder_rel": 0 * session_depth,
        "FirstNegativeButtonQueryOrder_rel": 0 * session_depth,
        "LastNegativeButtonQueryOrder_rel": 0 * session_depth,

        # OverallButton相关指标
        "UniqueOverallButtonRate": 1 if overall_button_total_count > 0 else 0,  
        "OverallButtonCountPerQuery": overall_button_total_count / session_depth if session_depth > 0 else 0, 
        "StopGeneratingCount": stop_generating_count  
    }
    
    all_session_metrics.append(session_metric)


df = pd.DataFrame(all_session_metrics)
df.to_csv("C:/Users/Administrator/Desktop/cope/COPE/evaluation/results/optimal2_result.csv", index=False)
print(f"指标计算完成，共处理 {len(all_session_metrics)} 个会话，已保存到 optimal2_result.csv")

